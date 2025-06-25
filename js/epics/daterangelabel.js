/*
 * Copyright 2024, Riccardo Mari - CNR-Ibimet - Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import { Observable } from 'rxjs';
import { LAYER_LOAD } from '@mapstore/actions/layers';
import { updateDatesLayer, errorLayerNotFound, errorLayerDateMissing, markAsNotLoaded } from '../actions/daterangelabel';
import { isVariabiliMeteoLayer } from '../utils/VariabiliMeteoUtils';
import { LOADING } from '@mapstore/actions/maps';

const updateDateLabelEpic = (action$, store) =>
    action$.ofType(LAYER_LOAD)
        .filter(({layerId}) => {
            const state = store.getState();
            const pluginsFromContext = state?.context?.currentContext?.plugins?.desktop || [];
            const pluginsFromConfig = state?.context?.pluginsConfig?.desktop || [];
            const allPlugins = [...pluginsFromContext, ...pluginsFromConfig];
            const isPluginLoaded = allPlugins.some(p => p?.name === 'DateRangeLabel');
            return layerId && isPluginLoaded;
        })
        .switchMap(({layerId}) => {
            const currentState = store.getState();
            const layers = currentState.layers?.flat || [];
            const variabiliMeteo = currentState.daterangelabel.variabiliMeteo;
            const activeLayer = layers.find(layer => layer.id === layerId);
            if (!activeLayer) {
                return Observable.of(errorLayerNotFound(layerId));
            }
            if (!isVariabiliMeteoLayer(activeLayer?.name, variabiliMeteo)) {
                // do nothing
                return Observable.empty();
            }
            const { fromData, toData } = activeLayer.params || {};
            if (!fromData || !toData) {
                return Observable.of(errorLayerDateMissing(layerId, fromData, toData));
            }
            return Observable.of(updateDatesLayer(layerId, fromData, toData));
        });

// Epic that resets plugin's state when the LOADING action is dispatched (i.e. when the user returns to the homepage)
const resetDateRangeLabelEpic = (action$, store) =>
    action$.ofType(LOADING)
        .filter(() => store.getState().daterangelabel.isPluginLoaded)
        .switchMap(() => Observable.of(markAsNotLoaded()));

export {
    updateDateLabelEpic,
    resetDateRangeLabelEpic
};
