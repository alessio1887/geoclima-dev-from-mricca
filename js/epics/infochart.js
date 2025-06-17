/*
 * Copyright 2024, Riccardo Mari - CNR-Ibimet - Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import { Observable } from 'rxjs';
import { TOGGLE_CONTROL, SET_CONTROL_PROPERTY, setControlProperty } from '@mapstore/actions/controls';
import { TOGGLE_MAPINFO_STATE,
    changeMapInfoState } from '../../MapStore2/web/client/actions/mapInfo';
import { updateAdditionalLayer, addAdditionalLayers, removeAdditionalLayer  } from '../../MapStore2/web/client/actions/additionallayers';
import {
    TOGGLE_INFOCHART,
    FETCH_INFOCHART_DATA,
    SET_INFOCHART_VISIBILITY,
    PLUGIN_NOT_LOADED,
    CHART_TYPE_CHANGED,
    fetchedInfoChartData,
    setInfoChartVisibility,
    fetchInfoChartData,
    notFetchedInfoChartData,
    setRangeManager,
    changePeriod, changeFromData,
    changeTab, changeToData,
    changeFixedRangeToData,
    markInfoChartAsNotLoaded,
    openAlert, changeChartVariable,
    closeAlert, resetChartRelayout,
    setDefaultPanelSize, resizeInfoChart } from '../actions/infochart';
import { CLICK_ON_MAP } from '@mapstore/actions/map';
import { LOADING } from '@mapstore/actions/maps';
import { getMarkerLayer } from '../../MapStore2/web/client/utils/MapInfoUtils';
import API from '../api/GeoClimaApi';
import { FIXED_RANGE, FREE_RANGE, MARKER_ID, getVisibleLayers, getDefaultPanelSize, containsValidChartData } from '../utils/VariabiliMeteoUtils';
import DateAPI from '../utils/ManageDateUtils';
import { showFixedRangePickerSelector, periodTypeSelector, isPluginLoadedSelector as isFixedRangeLoaded,
    fromDataFormSelector as fromDataFixedRangeForm, toDataFormSelector as toDataFixedRangeForm  } from '../selectors/fixedRangePicker';
import { isPluginLoadedSelector as isFreeRangeLoaded, fromDataFormSelector as fromDataFreeRangeForm,
    toDataFormSelector as toDataFreeRangeForm } from '../selectors/freeRangePicker';
import moment from 'moment';
import momentLocaliser from 'react-widgets/lib/localizers/moment';
momentLocaliser(moment);

// Function to retrieve the corresponding idTab based on the variable
const getIdTabFromVariable = (variable, tabList) => {
    // Iterate through each tab in the tabList
    for (const tab of tabList) {
        // Check if the variable exists in any group of the tab
        for (const group of tab.groupList) {
            if (group.id === variable) {
                return tab.id; // Return the idTab if variable matches
            }
        }
    }
    // default value
    return tabList[0].id;
};

const getVariableParamsFromTab = (idTab, idVariable, tabList) => {
    const variableList = tabList.find( tab => tab.id === idTab);
    return variableList.groupList.find(variable =>
        variable.id === idVariable
    );
};

const getVisibleGroups = (groupMS2List = []) => {
    if (!Array.isArray(groupMS2List)) {
        return [];
    }
    return groupMS2List
        .filter(group => group.visibility)
        .flatMap(group => group.nodes);
};

// Function to get default values
const getDefaultValues = (idVariabiliLayers, appState) => {
    const defaultVariable = Object.keys(idVariabiliLayers)[0] || '';
    return {
        variable: Object.keys(idVariabiliLayers)[0] || '',
        // fromData,
        // toData,
        // periodType: defaultPeriod,
        idTab: getIdTabFromVariable(defaultVariable, appState.infochart.tabList)
    };
};

const getNewMarker = (latlng) => {
    const newMarkerLayer = getMarkerLayer(
        MARKER_ID,
        latlng,
        "marker",
        { overrideOLStyle: true, style: { color: "red", weight: 2 } },
        "Punto selezionato"
    );
    return addAdditionalLayers([{
        id: MARKER_ID,
        options: newMarkerLayer,
        actionType: "overlay"
    }]);
};

const updateMarkerPosition = (latlng) => {
    const newMarkerLayer = getMarkerLayer(
        MARKER_ID,
        latlng,
        "marker",
        { overrideOLStyle: true, style: { color: "red", weight: 2 } },
        "Punto selezionato"
    );
    return updateAdditionalLayer(MARKER_ID, newMarkerLayer, "overlay", newMarkerLayer);
};

const getDisableInfoChartActions = (appState) => {
    let disableInfoChartActions = [];
    if (!appState.mapInfo?.enabled) {
        disableInfoChartActions.push(changeMapInfoState(true));
    }
    if (appState.infochart?.showInfoChartPanel) {
        disableInfoChartActions.push(setInfoChartVisibility(false, []));
        disableInfoChartActions.push(removeAdditionalLayer({ id: MARKER_ID }));
    }
    if (appState.controls?.chartinfo?.enabled) {
        disableInfoChartActions.push(setControlProperty("chartinfo", "enabled", false));
    }
    return disableInfoChartActions;
};

/**
 * Processes the API response data for chart display, determining appropriate Redux actions
 * based on data validity and structure. It dispatches different actions and alerts
 * depending on whether the data is present, partially present (for AIB nested responses),
 * or entirely absent.
 *
 * @param {Array} data The raw data array received from the API.
 * @param {object} infochartState The Redux state slice containing infoChartData parameters.
 * @returns {Array} An array of Redux actions to be dispatched.
 */
const checkResponseData = (data, infochartState) => {
    let actions = [];
    const infoChartParams = infochartState.infoChartData;
    const validationResult = containsValidChartData(data, infoChartParams);

    if (!validationResult.hasData) { // Case: No overall valid data found (e.g., empty array, or all values are null)
        actions.push(notFetchedInfoChartData());
        if (validationResult.isAibNested) {
            actions.push(openAlert("gcapp.errorMessages.noObservPrevData"));
        } else {
            actions.push(openAlert("gcapp.errorMessages.noData"));
        }
    } else if (validationResult.isAibNested) {  // Case: It's an AIB nested response and has at least some valid data (could be partial)
        const { hasObservatoData, hasPrevisioniData } = validationResult;
        if (hasObservatoData && hasPrevisioniData) {
            actions.push(fetchedInfoChartData(data, false));
        } else if (hasObservatoData) {
            actions.push(fetchedInfoChartData(data, false));
            actions.push(openAlert("gcapp.errorMessages.noPrevData"));
        } else if (hasPrevisioniData) {
            actions.push(fetchedInfoChartData(data, false));
            actions.push(openAlert("gcapp.errorMessages.noObservData"));
        }
    } else {  // Case: It's a flat/Geoclima response and has valid data (validationResult.hasData is true here)
        actions.push(fetchedInfoChartData(data, false));
    }
    return actions;
};

const getErrorHandlingActions = (error) => {
    const actions = [notFetchedInfoChartData()];
    const code = error?.data?.code;
    const status = error?.response?.status || error?.status;
    let erroreMessage = "gcapp.errorMessages.genericError";
    if (status === 400 && code === 'OUT_OF_REGION') {
        erroreMessage = "gcapp.errorMessages.outsideRegion";
    }
    actions.push(openAlert(erroreMessage));
    return actions;
};

/**
 * This method returns the first visible layer from an array of layers,
 * considering visibility defined either as an independent layer ID
 * or within a group of layers with a visibility property.
 *
 * @param  {Array} layers - An array of layer objects, each containing various properties,
 *                           including `id`, `visibility`, and `name`.
 * @param  {Array} [groups=[]] - An optional array of groups. Each group can be:
 *   - A string representing the ID of an independent layer (standalone).
 *   - An object with `nodes` (array of layer IDs) and `visibility` (boolean).
 * @return {Object|null} - The first visible layer object, or `null` if no visible layer is found.
 */
const getFirstVisibleLayer = (layers, groups = []) => {
    if (!Array.isArray(layers)) {
        return null;
    }
    // Copy and reverse the array to start checking the last layers first, then iterate through them
    const reversedLayers = [...layers].reverse();
    for (const layer of reversedLayers) {
        let groupOfLayer = null;
        let standaloneVisibleLayer = false;

        for (const group of groups) {
            if (typeof group === 'string' && group === layer.id) {
                // If the layer is a standalone ID (not part of any group)
                standaloneVisibleLayer = true;
                break;
            } else if (typeof group !== 'string') {
                // If the layer is part of a group, check if it's among the group's nodes
                for (const nodeId of group.nodes) {
                    if (layer.id === nodeId) {
                        groupOfLayer = group;
                        break;
                    }
                }
            }
        }
        if (standaloneVisibleLayer || (groupOfLayer && groupOfLayer.visibility)) {
            return layer;
        }
    }
    return null;  // If no visible layer is found, return null
};


/**
 * Determines the appropriate variable key based on the visible map layer ID.
 *
 * This function sets `chartVariable` to the corresponding key in `idVariabiliLayers` based on
 * a match with the `visibleLayer`. If no match is found, it defaults to the first key in
 * `idVariabiliLayers`.
 *
 * @param {string} visibleLayer - The name of the visible layer, which will be checked for a match.
 * @param {Object} idVariabiliLayers - An object mapping variable keys to associated layer names (arrays).
 * @returns {string} - The matched variable key from `idVariabiliLayers` or the default key if no match is found.
 */
const setVisVariable = (visibleLayer, idVariabiliLayers) => {
    // Default to the first key in idVariabiliLayers if no match is found
    let chartVariable = Object.keys(idVariabiliLayers)[0];

    const transformedVisibleIdLayer = visibleLayer.replace(/[_\s]/g, '').toLowerCase();

    // Iterate over idVariabiliLayers to find a matching key
    for (const [key, variabiliNames] of Object.entries(idVariabiliLayers)) {
        const transformedVariabiliNames = variabiliNames.map(name =>
            name.replace(/[_\s]/g, '').toLowerCase()
        );

        // Check if any name in the list matches the visible layer
        if (transformedVariabiliNames.some(name => name === transformedVisibleIdLayer)) {
            chartVariable = key;
            break; // Exit loop once a match is found
        }
    }
    // Return the matched key or default
    return chartVariable;
};

// Function to get values from a visible layer
const getVisibleLayerValues = (visibleLayer, appState) => {
    const idVariabiliLayers = appState.infochart.idVariabiliLayers;
    const variable = setVisVariable(visibleLayer.name, idVariabiliLayers);
    const idTab = getIdTabFromVariable(variable, appState.infochart.tabList); // Use the function to get idTab
    return {
        variable,
        idTab
    };
};

/**
 * Calculates and returns the variables needed for configuring the InfoChart panel.
 *
 * @param {Object} appState - The global state of the application.
 * @returns {Object} - An object containing:
 *   - `variable` (string): The selected variable.
 *   - 'idTab' (string): chart's type
 */
const getInitialChartConfig = (appState) => {
    // 1. Check for tab with isDefaultTab === true
    const defaultTab = appState.infochart.tabList.find(tab => tab.isDefaultTab);
    if (defaultTab && defaultTab.groupList?.length > 0) {
        return {
            variable: defaultTab.groupList[0].id,
            idTab: defaultTab.id
        };
    }
    // 2. If no default tab, check for a visible layer
    const idVariabiliLayers = appState.infochart.idVariabiliLayers;
    const visibleLayer = getFirstVisibleLayer(getVisibleLayers(appState.layers.flat, idVariabiliLayers), getVisibleGroups(appState.layers.groups));
    if (visibleLayer) {
        return getVisibleLayerValues(visibleLayer, appState);
    }
    // 3. Fallback
    return getDefaultValues(idVariabiliLayers, appState);
};

// Close infochart when user come back to homepage
// TODO improve this method adding more actions to close the infochart panel ( set dates, infochart size, etc. )
const closeInfoChartPanel = (action$, store) =>
    action$.ofType(LOADING).switchMap(() => {
        const appState = store.getState();
        let disableInfoChartActions = getDisableInfoChartActions(appState);
        if (appState.infochart?.isPluginLoaded) {
            disableInfoChartActions.push(markInfoChartAsNotLoaded());
        }
        return Observable.of(...disableInfoChartActions);
    });

/**
 * Epic that toggles the state of the "chartinfo" control based on the "mapInfo" state.
 *
 * This epic listens for the `TOGGLE_MAPINFO_STATE` action and:
 *  - If "mapInfo" is disabled (`mapInfo.enabled === false`), it enables "chartinfo".
 *  - If "mapInfo" is enabled (`mapInfo.enabled === true`), it disables "chartinfo".
 *  - If the "InfoChartPanel" is open, it also hides it when disabling "chartinfo".
 *
 * The epic ensures that only one of "mapInfo" or "chartinfo" is active at a time.
 *
 * @param {Observable} action$ - Stream of Redux actions.
 * @param {Object} store - Redux store to access the current state.
 * @returns {Observable} - Emits actions to update the control properties.
 */
const toggleMapInfoEpic = (action$, store) =>
    action$.ofType(TOGGLE_MAPINFO_STATE)
        .filter(() => store.getState().controls.chartinfo.enabled)
        .switchMap(() => {
            const appState = store.getState();
            if (!appState.mapInfo.enabled) { // case MapInfoButton is going to be disabled
                return Observable.of(setControlProperty("chartinfo", "enabled", true));
            }
            // case MapInfoButton is going to be abled
            const disableInfoChartActions = [setControlProperty("chartinfo", "enabled", false)];
            if (appState.infochart.showInfoChartPanel) {
                disableInfoChartActions.push(setInfoChartVisibility(false));
                disableInfoChartActions.push(removeAdditionalLayer({ id: MARKER_ID }));
            }
            return Observable.of(...disableInfoChartActions);
        });

/**
 * Epic that toggles the activation of the MapInfoButton (state.controls.chartinfo.enabled).
 * It also manages the visibility of the InfoChart and optionally restores some default settings (e.g., alert closure).
 * Triggered when clicking on the InfoChartButton in the Toolbar menu.
 */
const toggleInfoChartEpic = (action$, store) =>
    action$.ofType(TOGGLE_INFOCHART).switchMap((action) => {
        const appState = store.getState();
        const actions = [
            setControlProperty("chartinfo", "enabled", action.enable)
        ];
        if (!action.enable && appState.infochart.showInfoChartPanel) {
            actions.push(setInfoChartVisibility(false));
            actions.push(removeAdditionalLayer({ id: MARKER_ID }));
        }
        if (appState.infochart.alertMessage) {
            actions.push(closeAlert());
        }
        // If the InfoChartButton is to be disabled and the MapInfo button is disabled, toggle MapInfo (active MapInfo button).
        if (!action.enable && action.enable === appState.mapInfo?.enabled) {
            actions.push(changeMapInfoState(true));
        }
        // If the InfoChartButton is to be enabled and the MapInfo button is enabled, toggle MapInfo (disable MapInfo button).
        if (action.enable && action.enable === appState.mapInfo?.enabled) {
            actions.push(changeMapInfoState(false));
        }
        return Observable.of(...actions);
    });

/**
 * Epic that handles toggling controls, excluding specific controls (e.g., toolbar, chartinfo, and burgermenu).
 * If `chartinfo` is active, it disables it, hides the InfoChart, and removes the map marker.
 */
const toggleControlEpic = (action$, store) => {
    // Controls to exclude from toggling
    const excludedControls = ["toolbar", "chartinfo", "burgermenu", "about", "backgroundSelector", "drawer", "exportImage"];

    return action$
        .ofType(TOGGLE_CONTROL, SET_CONTROL_PROPERTY)
        .filter(({ control }) => !excludedControls.includes(control) && store.getState().controls?.chartinfo?.enabled)
        .switchMap(() => {
            const appState = store.getState();
            const actions = getDisableInfoChartActions(appState);
            return Observable.of(...actions);
        });
};

/**
 * Retrieves the date range from the active range picker plugin.
 * If a plugin is active, it extracts the date range from the corresponding state.
 * If no plugin is active or the selected range is invalid, it falls back to the default date range.
 *
 * @param {Object} appState - The application state.
 * @returns {Object} An object containing fromData, toData, and rangeManager.
 */
const getDateFromRangePicker = (appState) => {
    let fromData = null; let toData = null; let periodType = null;
    let rangeManager = FIXED_RANGE;
    if (isFixedRangeLoaded(appState) && showFixedRangePickerSelector(appState)) {
        fromData = fromDataFixedRangeForm(appState);
        toData = toDataFixedRangeForm(appState);
        periodType = periodTypeSelector(appState);
    } else if (isFreeRangeLoaded(appState) && !showFixedRangePickerSelector(appState)) {
        rangeManager = FREE_RANGE;
        fromData = fromDataFreeRangeForm(appState);
        toData = toDataFreeRangeForm(appState);
    }
    // Se nessun plugin è attivo o il range non è valido, usa le date di default
    const infoChartState = appState.infochart;
    if (!fromData || !toData ||
        !DateAPI.validateDateRange(fromData, toData, infoChartState.firstAvailableDate, infoChartState.lastAvailableDate, infoChartState.timeUnit).isValid) {
        toData = infoChartState.lastAvailableDate;
        // Perche in componentDidMount() viene settato il defaultPeriod
        fromData = moment(toData).clone().subtract(infoChartState.periodType.max, 'days').toDate();
    }
    return { fromData, toData, periodType, rangeManager };
};

/**
 * Redux-Observable epic that listens for the CLICK_ON_MAP action and handles updating
 * the InfoChart panel state, fetching its data and adding new marker.
 *
 * @param {Observable} action$ - The stream of Redux actions.
 * @param {Object} store - The Redux store instance, used to access the current application state.
 * @returns {Observable} - Emits a sequence of Redux actions to update the InfoChart panel state.
 */
const clickedPointCheckEpic = (action$, store) =>
    action$.ofType(CLICK_ON_MAP)
        .filter(() => store.getState().controls?.chartinfo?.enabled)
        .switchMap((action) => {
            const infochartState = store.getState().infochart;
            const timeUnit = infochartState.timeUnit;
            const latlng = action.point.latlng;
            let actions = [];
            let fromData; let toData;
            let variable; let idTab;
            let periodType = null;
            let markerAction;
            // Clear alert message if validations pass
            if (infochartState.alertMessage) {
                actions.push(closeAlert());
            }
            if (!infochartState.showInfoChartPanel) {
                const { fromData: fromDataTmp, toData: toDataTmp, periodType: periodTypeTmp, rangeManager } = getDateFromRangePicker(store.getState());
                const { variable: variableTmp, idTab: idTabTmp } = getInitialChartConfig(store.getState());
                const infoChartSize = infochartState.infoChartSize;
                const { width: newWidth, height: newHeight } = getDefaultPanelSize();
                fromData = fromDataTmp;
                toData = toDataTmp;
                periodType = periodTypeTmp;
                variable = variableTmp;
                idTab = idTabTmp;
                actions.push(setRangeManager(rangeManager));
                actions.push(changeFixedRangeToData(new Date(toData)));
                actions.push(changeFromData(new Date(fromData)));
                actions.push(changeToData(new Date(toData)));
                actions.push(changeTab(idTab));
                actions.push(changeChartVariable(idTab,
                    [getVariableParamsFromTab(idTab, variable, infochartState.tabList)]));
                markerAction = getNewMarker(latlng);
                if (periodType) {
                    actions.push(changePeriod(periodType));
                }
                if ( infoChartSize.defaultWidth !== newWidth || infoChartSize.defaultHeight !== newHeight) {
                    actions.push(setDefaultPanelSize(newWidth, newHeight));
                } else if ( infoChartSize.defaultWidth !== infoChartSize.widthResizable || infoChartSize.defaultHeight !== infoChartSize.heightResizable) {
                    actions.push(resizeInfoChart(infoChartSize.defaultWidth, infoChartSize.defaultHeight));
                }
            } else {
                // Se InfoChart è già aperto, le date e la variabile non cambiano.
                fromData = infochartState.infoChartData.fromData;
                toData = infochartState.infoChartData.toData;
                variable = infochartState.infoChartData.variables;
                idTab = infochartState.infoChartData.idTab;
                periodType = infochartState.periodType;
                markerAction = updateMarkerPosition(latlng);
                actions.push(resetChartRelayout());
            }

            actions.push(setInfoChartVisibility(true));
            actions.push(fetchInfoChartData({
                latlng: latlng,
                toData: moment(toData).format(timeUnit),
                fromData: moment(fromData).format(timeUnit),
                variables: variable,
                periodType: periodType || infochartState.periodType,
                idTab: idTab
            }));
            actions.push(markerAction);
            return Observable.of(...actions);
        });

/**
 * Handles fetching chart data (AIB or Geoclima)
 * based on the active tab. It dispatches appropriate success, failure,
 * or alert actions after validating the API response.
 *
 * @param {Observable} action$ - The Redux-Observable action stream.
 * @param {object} store - The Redux store instance, used to access the current state.
 * @returns {Observable<Action>} An observable of Redux actions to be dispatched.
 */
const loadInfoChartDataEpic = (action$, store) =>
    action$.ofType(FETCH_INFOCHART_DATA)
        .switchMap(() => {
            const state = store.getState().infochart;
            let apiCall;
            let apiUrl;

            const activeTab = state.tabVariables.find(tab => tab.active);

            if (activeTab && activeTab.id === 'aib') {
                apiCall = API.getAibChart;
                apiUrl = state.defaultUrlAibChart;
            } else {
                apiCall = API.geoclimachart;
                apiUrl = state.defaultUrlGeoclimaChart;
            }

            return Observable.defer(() => apiCall(state.infoChartData, apiUrl).then(res => res.data)
            ).switchMap(data => {
                const actions = checkResponseData(data, state);
                return Observable.of(...actions);
            })
                .takeUntil(
                    action$.ofType(SET_INFOCHART_VISIBILITY, PLUGIN_NOT_LOADED)
                        .filter(action =>
                            action.type === PLUGIN_NOT_LOADED ||
                            (action.type === SET_INFOCHART_VISIBILITY && action.status === false)
                        )
                )
                .catch(error => {
                    const errorHandlingActions = getErrorHandlingActions(error);
                    return Observable.concat(
                        ...errorHandlingActions.map(action => Observable.of(action)),
                        Observable.throw(error)
                    );
                });
        });

/**
 * Epic that reacts to a change in chart type (`CHART_TYPE_CHANGED`), then  based on specific conditions,
 * dispatches the `fetchInfoChartData` action to dynamically fetch chart-related data via API call.
 *
 * It first checks whether the currently active chart requires reloading (`needsDataReload`)
 * and ensures that there is an active tab and valid chart configuration.
 *
 * If a reload is necessary, it further checks whether the list of variables selected in the active tab
 * differs from the ones currently used in the chart data (`infoChartData.variables`).
 *
 * Only if the variables have changed, it triggers the `fetchInfoChartData` action
 * to fetch new chart data from the server.
 *
 * This prevents unnecessary API calls when the chart type changes but the data is already up to date.
 *
 * @param {Observable<Action>} action$ - The stream of Redux actions.
 * @param {Object} store - The Redux store instance, used to access the current state.
 * @returns {Observable<Action>} A stream of `FETCH_INFOCHART_DATA` actions or an empty observable.
 */
const fetchChartDataOnChartTypeChangeEpic = (action$, store) =>
    action$.ofType(CHART_TYPE_CHANGED)
        .filter((action) => {
            const infochartState = store.getState().infochart;
            const { idChartType } = action;
            const activeTab = infochartState.tabVariables.find(tab => tab.active === true);
            if (!activeTab) {
                return false;
            }
            const chartConfig = activeTab.chartList.find(chart => chart.id === idChartType);
            if (!chartConfig) {
                return false;
            }
            return chartConfig.needsDataReload;
        })
        .switchMap(() => {
            const infochartState = store.getState().infochart;
            const activeTab = infochartState.tabVariables.find(tab => tab.active === true);

            const currentInfoChartData = infochartState.infoChartData;

            let tabVariablesString = null;
            if (activeTab.variables && activeTab.variables.length > 0) {
                if (activeTab.variables.length === 1) {
                    tabVariablesString = activeTab.variables[0].id;
                } else {
                    tabVariablesString = activeTab.variables.map(v => v.id).join(',');
                }
            }
            /*
             * Check if the tabVariablesString is empty or matches the current variables
             to avoid unnecessary API calls if the data are the same
             */
            if (!tabVariablesString || tabVariablesString.trim() === currentInfoChartData.variables) {
                // do nothing
                return Observable.empty();
            }

            const params = {
                fromData: currentInfoChartData.fromData,
                idTab: currentInfoChartData.idTab,
                latlng: currentInfoChartData.latlng,
                periodType: currentInfoChartData.periodType,
                toData: currentInfoChartData.toData,
                variables: tabVariablesString
            };
            return Observable.of(fetchInfoChartData(params));
        });


export {
    toggleMapInfoEpic,
    toggleInfoChartEpic,
    clickedPointCheckEpic,
    loadInfoChartDataEpic,
    closeInfoChartPanel,
    toggleControlEpic,
    fetchChartDataOnChartTypeChangeEpic
};
