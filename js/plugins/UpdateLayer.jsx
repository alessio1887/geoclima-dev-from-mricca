/**
 * Copyright 2024, Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { createPlugin } from '@mapstore/utils/PluginsUtils';
import * as updateLayerFromRemoteDateEpic from '../epics/updateLayerFromRemoteDateEpic';

// Componente fittizio invisibile
const UpdateLayerPlugin = () => null;
/*
 * Plugin invisibile che registra l'epic updateLayerFromRemoteDateEpic
 * al caricamento dell'applicazione.
 * Utile per eseguire logica automatica (es. aggiornare layer dinamici).
 */
export default createPlugin('UpdateLayer', {
    component: UpdateLayerPlugin,
    epics: updateLayerFromRemoteDateEpic
});
