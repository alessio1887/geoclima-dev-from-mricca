/**
 * Copyright 2024, Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
export const UPDATE_RANGE_LABEL = 'RANGE_LABEL:UPDATE_RANGE_LABEL';
export const NOT_FOUND_LAYER = 'RANGE_LABEL:NOT_FOUND_LAYER';
export const LAYER_DATE_MISSING = 'RANGE_LABEL:LAYER_DATE_MISSING';
export const SET_VARIABILIMETEO = 'RANGE_LABEL:SET_VARIABILIMETEO';
export const PLUGIN_LOADED = 'RANGE_LABEL:PLUGIN_LOADED';
export const PLUGIN_NOT_LOADED = 'RANGE_LABEL:PLUGIN_NOT_LOADED';

export function updateDatesLayer(layerId, fromData, toData) {
    return {
        type: UPDATE_RANGE_LABEL,
        layerId,
        fromData,
        toData
    };
}
export function errorLayerDateMissing(layerId,  fromData, toData) {
    return {
        type: LAYER_DATE_MISSING,
        layerId,
        fromData,
        toData
    };
}
export function errorLayerNotFound(layerId) {
    return {
        type: NOT_FOUND_LAYER,
        layerId
    };
}

export function setVariabiliMeteo(variabiliMeteo) {
    return {
        type: SET_VARIABILIMETEO,
        variabiliMeteo
    };
}

export function markAsLoaded() {
    return {
        type: PLUGIN_LOADED
    };
}

export function markAsNotLoaded() {
    return {
        type: PLUGIN_NOT_LOADED
    };
}
