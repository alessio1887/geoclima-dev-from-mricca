/**
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import { UPDATE_DATES, SET_VARIABILIMETEO, INITIALIZE_TABS, TAB_CHANGED, EXPORTIMAGE_ERROR, RESET_PLUGIN,
    IMAGEVARIABLE_CHANGED, EXPORTIMAGE_SUCCESS, CLEAR_IMAGE_URL, EXPORTIMAGE_LOADING, SET_TIME_UNIT,
    PLUGIN_LOADED, PLUGIN_NOT_LOADED} from '../actions/exportimage';
import { DEFAULT_FILENAME } from '../utils/VariabiliMeteoUtils';
import DateAPI from '../utils/ManageDateUtils';


const defaultState = {
    fromData: new Date(),
    toData: new Date(),
    fileName: DEFAULT_FILENAME,
    tabVariables: [],
    climateLayers: []
};

function exportimage(state = defaultState, action) {
    switch (action.type) {
    case UPDATE_DATES:
        return {
            ...state,
            fromData: new Date(action.fromData),
            toData: new Date(action.toData),
            alertMessage: DateAPI.shouldResetAlertMessage(state, action)
        };
    case SET_VARIABILIMETEO:
        return {
            ...state,
            climateLayers: action.variabiliMeteo
        };
    case SET_TIME_UNIT:
        return {
            ...state,
            timeUnit: action.timeUnit
        };
    case INITIALIZE_TABS:
        return {
            ...state,
            tabVariables: action.tabVariables
        };
    case RESET_PLUGIN:
        return {
            ...state,
            tabVariables: defaultState.tabVariables,
            climateLayers: defaultState.climateLayers
        };
    case TAB_CHANGED:
        return {
            ...state,
            tabVariables: state.tabVariables.map(tab => ({
                ...tab,
                active: tab.id === action.idTab // Imposta true solo per il tab con id uguale a idTab
            })),
            imageUrl: state.imageUrl ? null : state.imageUrl
        };
    case IMAGEVARIABLE_CHANGED:
        return {
            ...state,
            tabVariables: state.tabVariables.map(tab =>
                tab.id === action.idTab
                    ? { ...tab, variables: action.variable } // Aggiorna le variabili del tab corrispondente
                    : tab
            )
        };
    case EXPORTIMAGE_LOADING:
        return { ...state, maskLoading: true };
    case EXPORTIMAGE_SUCCESS:
        return { ...state,
            imageUrl: action.urlExportImage,
            fileName: action.fileName,
            maskLoading: false,
            alertMessage: state.alertMessage ? null : state.alertMessage
        };
    case EXPORTIMAGE_ERROR:
        return { ...state,
            imageUrl: state.imageUrl ? null : state.imageUrl,
            fileName: DEFAULT_FILENAME,
            maskLoading: false,
            alertMessage: "gcapp.exportImage.alertMessage"
        };
    case CLEAR_IMAGE_URL:
        return { ...state, imageUrl: null, fileName: DEFAULT_FILENAME };
    case PLUGIN_LOADED:
        return {
            ...state,
            isPluginLoaded: true
        };
    case PLUGIN_NOT_LOADED:
        return {
            ...state,
            isPluginLoaded: false
        };
    default:
        return state;
    }
}

export default exportimage;
