/**
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import { UPDATE_RANGE_LABEL, SET_VARIABILIMETEO, PLUGIN_LOADED, PLUGIN_NOT_LOADED } from '../actions/daterangelabel';

const defaultState = {
    fromData: new Date(),
    toData: new Date(),
    isPluginLoaded: false
};

function daterangelabel(state = defaultState, action) {
    switch (action.type) {
    case UPDATE_RANGE_LABEL:
        return {
            ...state,
            fromData: action.fromData,
            toData: action.toData
        };
    case SET_VARIABILIMETEO:
        return {
            ...state,
            variabiliMeteo: action.variabiliMeteo
        };
    case PLUGIN_LOADED:
    case PLUGIN_NOT_LOADED:
        return {
            ...state,
            isPluginLoaded: action.type === PLUGIN_LOADED
        };
    default:
        return state;
    }
}

export default daterangelabel;
