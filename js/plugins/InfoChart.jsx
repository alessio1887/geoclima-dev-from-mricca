/*
 * Copyright 2024, Riccardo Mari - CNR-Ibimet - Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import {connect} from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import {setInfoChartVisibility, changeFixedRangeToData, fetchInfoChartData, fetchedInfoChartData, toggleInfoChart,
    changeChartVariable, changePeriod, changeFromData, changeToData, setDefaultDates, collapseRangePicker,
    openAlert, closeAlert, setChartRelayout, resetChartRelayout, resizeInfoChart, setIdVariabiliLayers,
    setRangeManager, setDefaultUrlGeoclimaChart, setTimeUnit, changeChartType, setDafaultPanelSize,
    markInfoChartAsLoaded, changeTab, setTabList, initializeVariableTabs } from '../actions/infochart';
import { removeAdditionalLayer  } from '@mapstore/actions/additionallayers';
import InfoChartButton from '../components/buttons/InfoChartButton';
import InfoChart from '../components/infochart/InfoChart';
import { createPlugin } from '@mapstore/utils/PluginsUtils';
import infoChartReducer from '../reducers/infochart';
import { fetchSelectDate } from '@js/actions/updateDatesParams';
import * as infoChartEpic from '../epics/infochart';
import assign from 'object-assign';
import { isPluginLoadedSelector, fromDataFormSelector, toDataFormSelector, periodTypeSelector,
    firstAvailableDateSelector, lastAvailableDateSelector, activeRangeManagerSelector,
    alertMessageSelector, dataSelector, infoChartDataSelector, maskLoadingSelector,
    isInteractionDisabledSelector, isCollapsedFormGroupSelector } from '../selectors/infoChart';
import moment from 'moment';
import momentLocaliser from 'react-widgets/lib/localizers/moment';
momentLocaliser(moment);

/*
Plugin configuration
"name": "InfoChart",
    "defaultConfig": {
        "defaultUrlGeoclimaChart": "geoportale.lamma.rete.toscana.it/cgi-bin/geoclima_app/geoclima_chart_test.py",
        "defaultUrlSelectDate": "geoportale.lamma.rete.toscana.it/cgi-bin/geoclima_app/selectDate.py",
        "variabileSelectDate": "prec",
        "isFetchAvailableDates": false,
        "periodTypes": [
          {
            "key": "a",
            "label": "7 giorni",
            "max": 6
          },
          {
            "key": "b",
            "label": "10 giorni",
            "max": 9,
            "isDefault": true
          },
          {
            "key": "c",
            "label": "30 giorni",
            "max": 29
          },
          {
            "key": "d",
            "label": "90 giorni",
            "max": 89
          },
          {
            "key": "e",
            "label": "180 giorni",
            "max": 179
          },
          {
            "key": "f",
            "label": "365 giorni",
            "max": 364
          }
        ],
        "tabList": [
          {
            "id": "variableList",
            "name": "Variabili Meteo",
            "groupList": [
              {
                "id": "prec",
                "name": "Precipitazione",
                "chartList": [
                  {
                    "id": "prec1",
                    "name": "Pioggia clima",
                    "chartType": "clima",
                    "unit": "mm",
                    "yaxis": "Precipitazione (mm)",
                    "chartStyle1": { // climatologico
                      "color": "rgba(0, 0, 255, 1",
                      "opacity": 0.6
                    },
                    "chartStyle2": { // anno in corso
                      "color": "rgba(255, 0, 0, 1)",
                      "width": 1
                    }
                  },
                  {
                    "id": "prec2",
                    "name": "Pioggia cumulata",
                    "chartType": "cumulata",
                    "unit": "mm",
                    "yaxis": "Precipitazione (mm)",
                    "yaxis2": "Precipitazione cumulata (mm)",
                    "chartStyle1": { // giornaliero
                      "color": "#ffaf1f",
                      "width": 1
                    },
                    "chartStyle2": { // cumulata
                      "color": "rgba(255, 0, 0, 1)",
                      "width": 1
                    }
                  }
                ]
              },
              {
                "id": "tmed",
                "name": "Temperatura Media",
                "unit": "°C",
                "chartType": "clima",
                "yaxis": "Temperatura (°C)",
                "chartStyle1": { "color": "rgba(0, 0, 255, 1)", "width": 1 },
                "chartStyle2": { "color": "rgba(255, 0, 0, 1)", "width": 1 }
              },
              {
                "id": "tmax",
                "name": "Temperatura Massima",
                "unit": "°C",
                "chartType": "clima",
                "yaxis": "Temperatura (°C)",
                "chartStyle1": { "color": "rgba(0, 0, 255, 1)", "width": 1 },
                "chartStyle2": { "color": "rgba(255, 0, 0, 1)", "width": 1 }
              },
              {
                "id": "tmin",
                "name": "Temperatura Minima",
                "unit": "°C",
                "chartType": "clima",
                "yaxis": "Temperatura (°C)",
                    "chartStyle1": { "color": "rgba(0, 0, 255, 1)", "width": 1 },
                    "chartStyle2": { "color": "rgba(255, 0, 0, 1)", "width": 1 }
              },
              {
                "id": "ret",
                "name": "Evapotraspirazione Potenziale",
                "unit": "mm",
                "chartType": "clima",
                "yaxis": "Valore (mm)",
                "chartStyle1": { "color": "rgba(0, 0, 255, 1)", "width": 1 },
                "chartStyle2": { "color": "rgba(255, 0, 0, 1)", "width": 1 }
              },
              {
                "id": "bis",
                "name": "Bilancio Idrico Semplificato",
                "unit": "mm",
                "chartType": "clima",
                "yaxis": "Valore (mm)",
                "chartStyle1": { "color": "rgba(0, 0, 255, 1)", "width": 1 },
                "chartStyle2": { "color": "rgba(255, 0, 0, 1)", "width": 1 }
              }
            ],
            "menuType": "single_select",
            "chartType": "single_variable"
          },
          {
            "id": "spiList",
            "name": "SPI",
            "groupList": [
              {
                "id": "spi1",
                "name": "SPI-1",
                "chartStyle": { "color": "green", "width": 2, "shape": "linear" }
              },
              {
                "id": "spi3",
                "name": "SPI-3",
                "chartStyle": { "color": "black", "width": 2, "shape": "linear" }
              },
              {
                "id": "spi6",
                "name": "SPI-6",
                "chartStyle": { "color": "teal", "width": 2, "shape": "linear" }
              },
              {
                "id": "spi12",
                "name": "SPI-12",
                "chartStyle": { "color": "gray", "width": 2, "shape": "linear" }
              }
            ],
            "chartTitle": "Indice SPI - Standardized Precipitation Index",
            "menuType": "multi_select",
            "chartType": "multi_variable",
            "backgroundBands": [
              {
                "min": -3,
                "max": -2,
                "color": "rgba(99,0,4,0.5)"
              },
              {
                "min": -2,
                "max": -1.5,
                "color": "rgba(198,0,16,0.5)"
              },
              {
                "min": -1.5,
                "max": -1,
                "color": "rgba(253,127,31,0.5)"
              },
              {
                "min": -1,
                "max": -0.5,
                "color": "rgba(253,254,123,0.5)"
              },
              {
                "min": -0.5,
                "max": 0.5,
                "color": "rgba(225,225,225,0.5)"
              },
              {
                "min": 0.5,
                "max": 1,
                "color": "rgba(210,255,192,0.5)"
              },
              {
                "min": 1,
                "max": 1.5,
                "color": "rgba(153,229,39,0.5)"
              },
              {
                "min": 1.5,
                "max": 2,
                "color": "rgba(52,150,20,0.5)"
              },
              {
                "min": 2,
                "max": 3,
                "color": "rgba(39,80,6,0.5)"
              }
            ]
          },
          {
            "id": "speiList",
            "name": "SPEI",
            "groupList": [
              {
                "id": "spei1",
                "name": "SPEI-1",
                "chartStyle": { "color": "green", "width": 2, "shape": "linear" }
              },
              {
                "id": "spei3",
                "name": "SPEI-3",
                "chartStyle": { "color": "black", "width": 2, "shape": "linear" }
              },
              {
                "id": "spei6",
                "name": "SPEI-6",
                "chartStyle": { "color": "teal", "width": 2, "shape": "linear" }
              },
              {
                "id": "spei12",
                "name": "SPEI-12",
                "chartStyle": { "color": "gray", "width": 2, "shape": "linear" }
              }
            ],
            "chartTitle": "Indice SPEI - Standardized Precipitation-Evapotranspiration Index",
            "menuType": "multi_select",
            "chartType": "multi_variable",
            "backgroundBands": [
              {
                "min": -3,
                "max": -2,
                "color": "rgba(99,0,4,0.5)"
              },
              {
                "min": -2,
                "max": -1.5,
                "color": "rgba(198,0,16,0.5)"
              },
              {
                "min": -1.5,
                "max": -1,
                "color": "rgba(253,127,31,0.5)"
              },
              {
                "min": -1,
                "max": -0.5,
                "color": "rgba(253,254,123,0.5)"
              },
              {
                "min": -0.5,
                "max": 0.5,
                "color": "rgba(225,225,225,0.5)"
              },
              {
                "min": 0.5,
                "max": 1,
                "color": "rgba(210,255,192,0.5)"
              },
              {
                "min": 1,
                "max": 1.5,
                "color": "rgba(153,229,39,0.5)"
              },
              {
                "min": 1.5,
                "max": 2,
                "color": "rgba(52,150,20,0.5)"
              },
              {
                "min": 2,
                "max": 3,
                "color": "rgba(39,80,6,0.5)"
              }
            ]
          },
          {
            "id": "aib",
            "name": "AIB indici previsione",
            "menuType": "single_select",
            "chartType": "aib_historic_chart",
            "chartList": [
                  {
                    "id": "aib1",
                    "name": "Storico",
                    "chartType": "aib_historic_chart"
                  },
                  {
                    "id": "aib2",
                    "name": "Previsonale",
                    "chartType": "aib_previsionale",
                    "showOneDatePicker": true
                  }
            ],
            "groupList": [
              {
                "id": "fwi",
                "name": "Fire Weather Index",
                "chartStyle": { "color": "#000", "width": 2, "shape": "linear" },
                "backgroundBands": [
                  { "class": "Low", "min": 0, "max": 5, "color": "rgba(191,252,207,0.5)" },
                  { "class": "Moderate", "min": 5, "max": 10, "color": "rgba(241,232,105,0.5)" },
                  { "class": "High", "min": 10, "max": 20, "color": "rgba(252,163,17,0.5" },
                  { "class": "Very High", "min": 20, "max": 30, "color": "rgba(230,57,70,0.5)" },
                  { "class": "Extreme", "min": 30, "max": 50, "color": "rgba(157,2,8,0.5)" }
                ]
              },
              {
                "id": "ffmc",
                "name": "Fine Fuel Moisture Code",
                "chartStyle": { "color": "#000", "width": 2, "shape": "linear" },
                "backgroundBands": [
                  { "class": "Low", "min": 0, "max": 63, "color": "rgba(191,252,207,0.5)" },
                  { "class": "Moderate", "min": 63, "max": 84, "color": "rgba(241,232,105,0.5)" },
                  { "class": "High", "min": 84, "max": 88, "color": "rgba(252,163,17,0.5" },
                  { "class": "Very High", "min": 88, "max": 91, "color": "rgba(230,57,70,0.5)" },
                  { "class": "Extreme", "min": 91, "max": 100, "color":"rgba(157,2,8,0.5)" }
                ]
              },
              {
                "id": "dmc",
                "name": "Duff Moisture Code",
                "chartStyle": { "color": "#000", "width": 2, "shape": "linear" },
                "backgroundBands": [
                  { "class": "Low", "min": 0, "max": 21, "color": "rgba(191,252,207,0.5)" },
                  { "class": "Moderate", "min": 21, "max": 27, "color": "rgba(241,232,105,0.5)" },
                  { "class": "High", "min": 27, "max": 40, "color": "rgba(252,163,17,0.5" },
                  { "class": "Very High", "min": 40, "max": 60, "color": "rgba(230,57,70,0.5)" },
                  { "class": "Extreme", "min": 60, "max": 90, "color": "rgba(157,2,8,0.5)" }
                ]
              },
              {
                "id": "dc",
                "name": "Drought Code",
                "chartStyle": { "color": "#000", "width": 2, "shape": "linear" },
                "backgroundBands": [
                  { "class": "Low", "min": 0, "max": 80, "color": "rgba(0, 0, 255, 0.5)" },
                  { "class": "Moderate", "min": 80, "max": 190, "color": "rgba(191,252,207,0.5)" },
                  { "class": "High", "min": 190, "max": 300, "color": "rgba(241,232,105,0.5)" },
                  { "class": "Very High", "min": 300, "max": 425, "color": "rgba(252,163,17,0.5)" },
                  { "class": "Extreme", "min": 425, "max": 600, "color": "rgba(230,57,70,0.5)" },
                  { "class": "Very Extreme", "min": 600, "max": 800, "color": "rgba(157,2,8,0.5)" },
                  { "class": "Very Very Extreme", "min": 800, "max": 1000, "color": "rgba(106,4,15,0.5)" }
                ]
              },
              {
                "id": "isi",
                "name": "Initial Spread Index",
                "chartStyle": { "color": "#000", "width": 2, "shape": "linear" },
                "backgroundBands": [
                  { "class": "Low", "min": 0, "max": 3, "color": "rgba(191,252,207,0.5)" },
                  { "class": "Moderate", "min": 3, "max": 5.0, "color": "rgba(241,232,105,0.5)" },
                  { "class": "High", "min": 5.0, "max": 7, "color": "rgba(252,163,17,0.5" },
                  { "class": "Very High", "min": 7, "max": 13, "color": "rgba(230,57,70,0.5)" },
                  { "class": "Extreme", "min": 13, "max": 20, "color": "rgba(157,2,8,0.5)" }
                ]
              },
              {
                "id": "bui",
                "name": "Build Up Index",
                "chartStyle": { "color": "#000", "width": 2, "shape": "linear" },
                "backgroundBands": [
                  { "class": "Low", "min": 0, "max": 24.2, "color": "rgba(191,252,207,0.5)" },
                  { "class": "Moderate", "min": 24.2, "max": 40.7, "color": "rgba(241,232,105,0.5)" },
                  { "class": "High", "min": 40.7, "max": 73.3, "color": "rgba(252,163,17,0.5" },
                  { "class": "Very High", "min": 73.3, "max": 133.1, "color": "rgba(230,57,70,0.5)" },
                  { "class": "Extreme", "min": 133.1, "max": 193.1, "color": "rgba(157,2,8,0.5)" },
                  { "class": "Very Extreme", "min": 193.1, "max": 250, "color": "rgba(106,4,15,0.5)" }
                ]
              }
            ]
          }
        ],
        "idVariabiliLayers": {
          "prec": [
            "Pioggia_Anomalia_perc",
            "Pioggia_Anomalia_mm",
            "Pioggia_Cumulata",
            "Pioggia_Cumulata_clima",
            "Pioggia_Cumulata_Giornaliera",
            "Prec_stazioni",
            "Prec_stazioni_non_utilizzate"
          ],
          "tmed": [
            "Temperatura_Media",
            "Temperatura_Media_Anomalia",
            "Temperatura_Media_clima",
            "Vven_stazioni",
            "Vven_stazioni_non_utilizzate",
            "Umidita_media_giornaliera",
            "Umid_stazioni",
            "Umid_stazioni_non_utilizzate",
            "Pressione_Mare_Giornaliera",
            "Pressione_Suolo_Giornaliera",
            "Mslp_stazioni",
            "Mslp_stazioni_non_utilizzate",
            "Radiazione_Globale_Giornaliera",
            "Evapotraspirazione_Potenziale_Giornaliera"
          ],
          "tmin": [
            "Temperatura_Minima",
            "Temperatura_Minima_Anomalia",
            "Temperatura_Minima_clima",
            "Temperatura_Minima_Giornaliera",
            "Tmin_stazioni",
            "Tmin_stazioni_non_utilizzate"
          ],
          "tmax": [
            "Temperatura_Massima",
            "Temperatura_Massima_Anomalia",
            "Temperatura_Massima_clima",
            "Temperatura_Massima_Giornaliera",
            "Tmax_stazioni",
            "Tmax_stazioni_non_utilizzate"
          ],
          "ret": [
            "Evapotraspirazione",
            "Evapotraspirazione_Anomalia_mm",
            "Evapotraspirazione_Anomalia_perc",
            "Evapotraspirazione_clima"
          ],
          "bis": [
            "BilancioIdricoSemplificato",
            "BilancioIdricoSemplificato_Anomalia_mm",
            "BilancioIdricoSemplificato_Anomalia_perc",
            "BilancioIdricoSemplificato_clima"
          ],
          "spi1": [
            "spi1"
          ],
          "spi3": [
            "spi3"
          ],
          "spi6": [
            "spi6"
          ],
          "spi12": [
            "spi12"
          ],
          "spei1": [
            "spei1"
          ],
          "spei3": [
            "spei3"
          ],
          "spei6": [
            "spei6"
          ],
          "spei12": [
            "spei12"
          ]
        },
        "timeUnit": "YYYY-MM-DD",
        "unitPrecipitazione": "mm",
        "unitTemperatura": "°C"
      },
      "override": {
        "Toolbar": {
          "alwaysVisible": true
        }
      },
      "dependencies": [
        "Toolbar",
        "Expander"
      ]
*/
const mapStateToProps = (state) => ({
    active: state && state.controls && state.controls.chartinfo && state.controls.chartinfo.enabled
});

const mapDispatchToProps = {
    onClick: (pressed, options) => toggleInfoChart(pressed, options.querySelector)
};

const InfoChartPlugin = connect(
    mapStateToProps,
    mapDispatchToProps
)(InfoChartButton);

const InfoChartPanel = connect(
    createStructuredSelector({
        active: (state) => state.controls?.chartinfo?.enabled || false,
        activeRangeManager: activeRangeManagerSelector,
        alertMessage: alertMessageSelector,
        data: dataSelector,
        infoChartData: infoChartDataSelector,
        mapinfoActive: (state) => state.mapInfo?.enabled || false,
        maskLoading: maskLoadingSelector,
        fromData: fromDataFormSelector,
        periodType: periodTypeSelector,
        isInteractionDisabled: isInteractionDisabledSelector,
        isCollapsedFormGroup: isCollapsedFormGroupSelector,
        chartRelayout: (state) => state.infochart?.chartRelayout,
        infoChartSize: (state) => state.infochart?.infoChartSize || { widthResizable: 880, heightResizable: 880 },
        firstAvailableDate: firstAvailableDateSelector,
        lastAvailableDate: lastAvailableDateSelector,
        isPluginLoaded: isPluginLoadedSelector,
        show: (state) => state.infochart?.showInfoChartPanel || false,
        tabVariables: (state) => state.infochart?.tabVariables,
        toData: toDataFormSelector
    }), {
        onFetchAvailableDates: fetchSelectDate,
        onFetchInfoChartData: fetchInfoChartData,
        onFetchedInfoChartData: fetchedInfoChartData,
        onChangeChartVariable: changeChartVariable,
        onChangeTab: compose(changeTab, (event) => event),
        onChangeChartType: changeChartType,
        onChangeToData: compose(changeToData, (event) => event),
        onChangeFromData: compose(changeFromData, (event) => event),
        onChangeFixedRangeTodata: compose(changeFixedRangeToData, (event) => event),
        onChangePeriod: changePeriod,
        onSetDafaultPanelSize: setDafaultPanelSize,
        onSetInfoChartDates: setDefaultDates,
        onSetInfoChartVisibility: setInfoChartVisibility,
        onSetTimeUnit: setTimeUnit,
        onCollapseRangePicker: collapseRangePicker,
        onInitializeVariableTabs: initializeVariableTabs,
        onSetRangeManager: setRangeManager,
        onSetTabList: setTabList,
        onOpenAlert: openAlert,
        onCloseAlert: closeAlert,
        onSetChartRelayout: compose(setChartRelayout, (event) => event),
        onResetChartZoom: resetChartRelayout,
        onResizeInfoChart: resizeInfoChart,
        onSetIdVariabiliLayers: setIdVariabiliLayers,
        onSetDefaultUrlGeoclimaChart: setDefaultUrlGeoclimaChart,
        onMarkPluginAsLoaded: markInfoChartAsLoaded,
        onHideMapinfoMarker: removeAdditionalLayer
    })(InfoChart);


export default createPlugin(
    'InfoChartPlugin',
    {
        component: assign(InfoChartPlugin, {
            Toolbar: {
                name: "infochart",
                position: 8,
                alwaysVisible: true,
                tool: true,
                priority: 1,
                tools: [InfoChartPanel],
                panel: InfoChartPanel
            }
        }),
        reducers: {
            infochart: infoChartReducer
        },
        epics: infoChartEpic
    }
);
