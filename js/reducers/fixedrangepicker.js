/**
 * Copyright 2024, Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
// import { LAYER_LOADING, LAYER_LOAD, LAYER_ERROR} from '@mapstore/actions/layers';
import {TODATA_CHANGED, MAP_PERIOD_CHANGED, TOGGLE_PLUGIN, OPEN_ALERT, CLOSE_ALERT,
    PLUGIN_LOADED, PLUGIN_NOT_LOADED, COLLAPSE_RANGE_PICKER } from '../actions/fixedrangepicker';
import { FETCHED_AVAILABLE_DATES, UPDATE_DATES_LAYER } from '../actions/updateDatesParams';
import { DEFAULT_DATA_FINE, DEFAULT_DATA_INIZIO } from '../utils/ManageDateUtils';
import moment from 'moment';
import momentLocaliser from 'react-widgets/lib/localizers/moment';
momentLocaliser(moment);

const defaultState = {
    isCollapsedPlugin: false,
    fromData: moment(DEFAULT_DATA_FINE).clone().subtract(10, 'days').startOf('day').toDate(),
    toData: DEFAULT_DATA_FINE,
    fromDataLayer: moment(DEFAULT_DATA_FINE).clone().subtract(10, 'days').startOf('day').toDate(),
    toDataLayer: DEFAULT_DATA_FINE,
    periodType: { key: 10, label: "20 giorni", min: 9, max: 20, isDefault: true  },
    showModal: false,
    imgSrc: "",
    showFixedRangePicker: false,
    isInteractionDisabled: false,
    isPluginLoaded: false
};

function fixedrangepicker(state = defaultState, action) {
    switch (action.type) {
    case TODATA_CHANGED:
        return {
            ...state,
            fromData: moment(action.toData).clone().subtract(Number(state.periodType.max), 'days').toDate(),
            toData: action.toData
        };
    case MAP_PERIOD_CHANGED:
        return {
            ...state,
            fromData: moment(state.toData).clone().subtract(action.periodType.max, 'days').toDate(),
            periodType: action.periodType
        };
    case UPDATE_DATES_LAYER:
        return {
            ...state,
            fromDataLayer: new Date(action.fromDataLayer),
            toDataLayer: new Date(action.toDataLayer)
        };
    case TOGGLE_PLUGIN:
        return {
            ...state,
            showFixedRangePicker: !state.showFixedRangePicker
        };
    case OPEN_ALERT:
        return {
            ...state,
            alertMessage: action.alertMessage
        };
    case CLOSE_ALERT:
        return {
            ...state,
            alertMessage: null
        };
    case COLLAPSE_RANGE_PICKER:
        return {
            ...state,
            isCollapsedPlugin: !state.isCollapsedPlugin
        };
    case PLUGIN_LOADED:
        return {
            ...state,
            isPluginLoaded: true,
            showOneDatePicker: action.showOneDatePicker,
            checkPrefixes: action.checkPrefixes,
            variabiliMeteo: action.variabiliMeteo
        };
    case PLUGIN_NOT_LOADED:
        return {
            ...state,
            isPluginLoaded: false,
            checkPrefixes: false
        };
    case FETCHED_AVAILABLE_DATES:
        const newDataFine = action.dataFine || DEFAULT_DATA_FINE;
        const newDataInizio = action.dataInizio || DEFAULT_DATA_INIZIO;
        return {
            ...state,
            firstAvailableDate: newDataInizio,
            lastAvailableDate: newDataFine
        };
    default:
        return state;
    }
}

export default fixedrangepicker;
