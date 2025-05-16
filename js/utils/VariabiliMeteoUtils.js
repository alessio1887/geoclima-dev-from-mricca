/**
 * Copyright 2024, Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { DATE_FORMAT } from './ManageDateUtils';

// type of range picher
export const FIXED_RANGE = "fixed_range_picker";
export const FREE_RANGE = "free_range_picker";
export const SINGLE_VARIABLE_CHART = "single_variable";
export const MULTI_VARIABLE_CHART = "multi_variable";
export const AIB_HISTORIC_CHART = "aib_historic_chart";
export const AIB_PREVISIONALE = "aib_previsionale";
export const CUMULATA_CHART = "cumulata";
export const CLIMA_CHART = "clima";
export const MARKER_ID = "InfoChartMarker";
export const DROP_DOWN = "single_select";
export const MULTI_SELECT = "multi_select";

export const DEFAULT_FILENAME = 'exported_image.png';

const ST_VALUE = "st_value_";
const defaultColors = ['green', 'black', 'teal', 'gray'];
const MIN_Y_INDEX = -3.0;
const MAX_Y_INDEX = 3.0;

export function isVariabiliMeteoLayer(layerName, variabiliMeteo) {
    if (typeof layerName !== "string" || !variabiliMeteo) {
        return false;
    }

    for (const nomeVariabile in variabiliMeteo) {
        if (Object.prototype.hasOwnProperty.call(variabiliMeteo, nomeVariabile)) {
            const lista = variabiliMeteo[nomeVariabile];

            const match = Array.isArray(lista) &&
                lista.find(prefix =>
                    typeof prefix === "string" && layerName.includes(prefix)
                );

            if (match) {
                return true;
            }
        }
    }

    return false;
}

export const getVisibleLayers = (layers, idVariabiliLayers) => {
    return layers
        .filter(layer => layer.visibility && isVariabiliMeteoLayer(layer.name, idVariabiliLayers));
};
//  Function to calculate the intersection between two line segments
function getIntersection(x1, y1, x2, y2, climY1, climY2) {
    // Calculate slopes
    const obsSlope = (y2 - y1) / (x2 - x1);
    const climSlope = (climY2 - climY1) / (x2 - x1);

    // Check for parallel lines
    if (obsSlope === climSlope) {
        return null; // No intersection
    }

    // Calculate intersection point
    const intersectionX = (climY1 - y1 + obsSlope * x1 - climSlope * x1) / (obsSlope - climSlope);

    // Calculate corresponding y value using either line's equation
    const yIntersect = y1 + obsSlope * (intersectionX - x1);

    return [intersectionX, yIntersect];
}

export function getVariabiliMeteo(currentState) {
    if (currentState.fixedrangepicker?.isPluginLoaded ) {
        return currentState.fixedrangepicker?.variabiliMeteo;
    }
    return currentState.freerangepicker?.variabiliMeteo;
}


/**
 * Colors the areas between the observed data and climatology using two different colors:
 * one color if the observed values are below climatology, and another color if they are above.
 * It also handles intersections between the two curves.
 */
export function fillAreas(dateObjects, observed, climatological, variable, unitPrecipitazione, yaxis = 'y') {
    let fillTraces = [];
    let  upperColor;
    let  belowColor;
    if (unitPrecipitazione === variable.unit ) {
        upperColor = 'rgba(0, 0, 255, 0.5)';
        belowColor = 'rgba(255, 0, 0, 0.5)';
    } else {
        upperColor = 'rgba(255, 0, 0, 0.5)';
        belowColor = 'rgba(0, 0, 255, 0.5)';
    }
    let i;
    for (i = 0; i < dateObjects.length - 1; i++) {
        const x0 = dateObjects[i].getTime();
        const x1 = dateObjects[i + 1].getTime();
        const y0Obs = observed[i];
        const y1Obs = observed[i + 1];
        const y0Clim = climatological[i];
        const y1Clim = climatological[i + 1];

        if (y0Obs === y0Clim && y1Obs !== y1Clim) {
            // Case where the observed temperature equals the climatological temperature
            fillTraces.push({
                x: [x0, x1, x1, x0],
                y: [y0Obs, y1Obs, y1Clim, y0Clim],
                fill: 'toself',
                fillcolor: y1Obs > y1Clim ? upperColor : belowColor,
                line: { color: 'transparent' },
                showlegend: false,
                hoverinfo: 'skip',
                yaxis: yaxis
            });
        } else if ((y0Obs < y0Clim && y1Obs > y1Clim) || (y0Obs > y0Clim && y1Obs < y1Clim)) {
            // Case of intersection when temperatures reverse
            const [xIntersect, yIntersect] = getIntersection(x0, y0Obs, x1, y1Obs, y0Clim, y1Clim);
            if (xIntersect !== null) {
                fillTraces.push({
                    x: [x0, xIntersect, xIntersect, x0],
                    y: [y0Obs, yIntersect, yIntersect, y0Clim],
                    fill: 'toself',
                    fillcolor: y0Obs > y0Clim ? upperColor : belowColor,
                    line: { color: 'transparent' },
                    showlegend: false,
                    hoverinfo: 'skip',
                    yaxis: yaxis
                });

                fillTraces.push({
                    x: [xIntersect, x1, x1, xIntersect],
                    y: [yIntersect, y1Obs, y1Clim, yIntersect],
                    fill: 'toself',
                    fillcolor: y1Obs > y1Clim ? upperColor : belowColor,
                    line: { color: 'transparent' },
                    showlegend: false,
                    hoverinfo: 'skip',
                    yaxis: yaxis
                });
            }
        } else {
            // Normal case without intersection
            fillTraces.push({
                x: [x0, x1, x1, x0],
                y: [Math.max(y0Obs, y0Clim), Math.max(y1Obs, y1Clim), Math.min(y1Obs, y1Clim), Math.min(y0Obs, y0Clim)],
                fill: 'toself',
                fillcolor: y0Obs > y0Clim ? upperColor : belowColor,
                line: { color: 'transparent' },
                showlegend: false,
                hoverinfo: 'skip',
                yaxis: yaxis
            });
        }
    }
    return fillTraces;
}


export function formatDataCum(values, propVariable) {
    let data = [];
    let cum = 0;
    let cumClima = 0;
    values.forEach(function(o) {
        data.push(
            {
                "data": o.data.substring(0, 10),
                [propVariable]: parseFloat(cum.toFixed(1)),
                "st_value_clima": parseFloat(cumClima.toFixed(1))
            }
        );
        cum += o[propVariable];
        cumClima += o.st_value_clima;
    }, this);
    return data;
}

export function formatDataTemp(values, propVariable) {
    return values.map(o => ({
        data: o.data.substring(0, 10),
        [propVariable]: (o[propVariable] !== null && o[propVariable] !== undefined)
            ? parseFloat(o[propVariable].toFixed(1))
            : 0,
        st_value_clima: (o.st_value_clima !== null && o.st_value_clima !== undefined)
            ? parseFloat(o.st_value_clima.toFixed(1))
            : 0
    }));
}
export function getDefaultPanelSize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    let width = 880;
    let height = 880;

    if (screenWidth < 710 || screenHeight < 710) {
        width = screenWidth;
        height = screenHeight - 60;
    } else {
        width = Math.min(screenWidth * 0.9, 880);
        height = Math.min(screenHeight * 0.9, 880);
    }
    return {
        width: width,
        height: height
    };
}

/**
 * Calculates the X position of the panel based on screen dimensions.
 *
 * This function calculates an offset and a scale factor based on the screen's width and height,
 * and then uses these values to determine the final X coordinate of the panel.
 *
 * @param {number} screenWidth - The width of the screen.
 * @param {number} screenHeight - The height of the screen.
 * @returns {number} The calculated X position of the panel.
 */
function getXPositionFromScreen(screenWidth, screenHeight) {
    // calculate offsetX: Calculates a horizontal offset based on screen width and height.
    // The base offset is linearly interpolated between two reference screen widths (x1, x2)
    // with corresponding offsets (y1, y2). An additional adjustment is applied based on the
    // screen's aspect ratio to prevent the panel from appearing too centered on shorter screens.
    const x1 = 2390; const y1 = 0;
    const x2 = 1510; const  y2 = 130;
    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;
    const baseOffset = m * screenWidth + b;
    const aspectRatio = screenWidth / screenHeight;
    const aspectAdjustment = (aspectRatio - 16 / 9); // tuning: 16/9 è "standard"
    const offsetX =  baseOffset + aspectAdjustment;

    // calculate scale between diagonals: Calculates a scaling factor based on the screen's diagonal.
    // This scale factor is used to adjust the panel's position proportionally to the screen size.
    const currentDiagonal = Math.sqrt(screenWidth ** 2 + screenHeight ** 2);
    const referenceDiagonal = Math.sqrt(2390 ** 2 + 1190 ** 2);
    const scale = currentDiagonal / referenceDiagonal;

    return  -850 * scale + offsetX;
}

/**
 * Calculates and returns the starting position (x, y coordinates) of the panel.
 *
 * This function determines the panel's position based on the screen's width and height.
 * It uses different calculation methods depending on the screen size.
 *
 * @returns {{x: number, y: number}} An object containing the x and y coordinates of the panel's starting position.
 */
export function getStartPositionPanel() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    // When screen is too small, panel is positioned at the top-left corner (0, 0)
    let y = 0; // Default Y position (top)
    let x = 0; // Default X position (left)
    if ( (screenWidth >= 1400 || screenHeight >= 1400) && (screenWidth > screenHeight)) {
        x = getXPositionFromScreen(screenWidth, screenHeight);
        const offsetY = Math.min(screenHeight * 0.1, 80);
        y = Math.max(-offsetY, -screenHeight + 100);
    } else if (screenWidth >= 450 && screenHeight >= 450 && screenWidth > screenHeight) {
        y = -80;
        const xPositionA = -180;
        const xPositionB = - (Math.max(screenWidth, screenHeight) / 10 + 100);
        x = Math.max(xPositionA, xPositionB);
    }
    return { x, y };
}


// Function to calculate the dynamic dtick for the y-axis
export function  getDtick(maxValue) {
    if (maxValue <= 10) {
        return 1;
    } else if (maxValue <= 100) {
        return 10;
    } else if (maxValue <= 1000) {
        return 100;
    }
    return Math.pow(10, Math.floor(Math.log10(maxValue)));
}


// for MultiTraces graph
export const createBackgroundBands = (dates, bands) => {
    if (!Array.isArray(bands) || bands.length === 0) {
        return []; // Nessuna banda da disegnare
    }

    return bands.map(({ min, max, color }) => ({
        x: dates.concat(dates.slice().reverse()),
        y: Array(dates.length).fill(min).concat(Array(dates.length).fill(max)),
        fill: 'toself',
        fillcolor: color,
        line: { width: 0 },
        hoverinfo: 'skip',
        showlegend: false,
        mode: 'lines'
    }));
};

/**
 * Generates Plotly-compatible trace objects from a list of variable definitions and their time series data.
 * This method supports both single-variable and multi-variable datasets by dynamically mapping values.
 *
 * @param {Array} dataSetDefinitions - Array of variable objects, each containing at least an `id`, `name`, and optionally `chartStyle`.
 * @param {Array} dates - Array of date strings or timestamps to be used as x-axis values.
 * @param {Array} dataFetched - Array of data records, each containing keys like `st_value_<id>`.
 * @returns {Array} Array of Plotly trace objects for visualizing the data.
 */
export const createMultiTraces = (dataSetDefinitions, dates, dataFetched) => {
    return dataSetDefinitions
        .filter(function(variable) {
            var valueKey = ST_VALUE + variable.id;
            return dataFetched.some(function(item) {
                return item[valueKey] !== null && item[valueKey] !== undefined;
            });
        })
        .map(function(variable, index) {
            var valueKey = ST_VALUE + variable.id;
            var values = dataFetched.map(function(item) {
                return item[valueKey] !== null && item[valueKey] !== undefined ? parseFloat(Number(item[valueKey]).toFixed(5)) : null;
            });

            var lineStyle = variable.chartStyle && Object.keys(variable.chartStyle).length
                ? variable.chartStyle
                : {
                    color: defaultColors[index % defaultColors.length],
                    width: 2
                };

            return {
                x: dates,
                y: values,
                mode: 'lines',
                name: variable.name,
                line: lineStyle,
                marker: { size: 6 },
                type: 'scatter',
                connectgaps: true
            };
        });
};

export const createObservedAndClimatologicalTraces = (variable, dates, dataFetched, unitPrecipitazione) => {
    const chartVariable = variable.id;
    const unit = variable.unit;
    const propVariable = "st_value_" + chartVariable;

    const chartData =  unit === unitPrecipitazione
        ? formatDataCum(dataFetched, propVariable)
        : formatDataTemp(dataFetched, propVariable);

    const climaLabel = "Climatologia " + ( unit || "");
    const currentYearLabel = "Anno in corso " + ( unit || "");

    const observedData = chartData.map(item => item[propVariable]);
    const climatologicalData = chartData.map(item => item.st_value_clima);
    const fillTraces = fillAreas(dates, observedData, climatologicalData, variable, unitPrecipitazione);

    const trace1 = {
        x: dates,
        y: climatologicalData,
        mode: 'lines',
        name: climaLabel,
        line: variable.chartStyle1
    };

    const trace2 = {
        x: dates,
        y: observedData,
        mode: 'lines',
        name: currentYearLabel,
        line: variable.chartStyle2
    };

    return [trace1, trace2].concat(fillTraces);
};

export const createCumulataBarTraces = (variables, times, dataFetched) => {
    const chartVariable = variables.id;
    const propVariable = ST_VALUE + chartVariable;

    // Estrae le precipitazioni e le converte in numeri
    const precipitations = dataFetched.map(item => parseFloat(parseFloat(item[propVariable]).toFixed(1)));
    const cumulativePrecip = formatDataCum(dataFetched, propVariable).map(item => item[propVariable]);

    const barStyle = variables.chartStyle1 ? { ...variables.chartStyle1 } : { color: '#FFAF1F', opacity: 0.6 };

    // Traccia a barre per la precipitazione istantanea
    const trace1 = {
        x: times,
        y: precipitations,
        type: 'bar',
        name: variables.yaxis,
        marker: barStyle
        // marker: { color: '#ff821f', opacity: 0.6 }
    };

    // Traccia a linea per la precipitazione cumulata (asse y secondario)
    const trace2 = {
        x: times,
        y: cumulativePrecip,
        type: 'scatter',
        mode: 'lines',
        name: variables.yaxis2,
        line: variables.chartStyle2,
        yaxis: 'y2'
    };

    return [trace1, trace2];
};


export const createCumulataBarLayout = (variables, chartTitle, traces, dates, format, chartRelayout, infoChartSize, isCollapsedFormGroup) => {
    const barTrace = traces[0].y;
    const maxPrecip = Math.max(...barTrace);
    const y1max = Math.max(maxPrecip, 6);
    const maxCum = Math.max(...traces[1].y);
    const y2max = Math.max(maxCum, 6);
    const dtick1 = getDtick(y1max);
    const scaleFactor = y2max / y1max;
    const dtick2 = dtick1 * scaleFactor;

    // Determina il range delle date
    const startDate = chartRelayout?.startDate
        ? new Date(chartRelayout.startDate)
        : new Date(Math.min(...dates));
    const endDate = chartRelayout?.endDate
        ? new Date(chartRelayout.endDate)
        : new Date(Math.max(...dates));

    // Determina il range per l asse y
    const yaxisRange = [chartRelayout?.yaxisStart || 0, chartRelayout?.yaxisEnd || y1max];
    const yaxis2Range = [chartRelayout?.yaxis2Start || 0, chartRelayout?.yaxis2End || y2max];

    return {
        width: infoChartSize.widthResizable - 10,
        height: infoChartSize.heightResizable - (isCollapsedFormGroup ? 140 : 400),
        title: {
            text: chartTitle,
            x: 0.05,
            xanchor: 'left'
        },
        barmode: 'overlay',
        xaxis: {
            tickformat: format !== DATE_FORMAT ? '%Y-%m-%d %H:%M:%S' : '%Y-%m-%d',
            tickangle: -20,
            range: [startDate, endDate],
            ticks: 'inside',
            ticklen: 5,
            tickwidth: 1,
            tickcolor: '#000'
        },
        yaxis: {
            title: variables.yaxis,
            range: yaxisRange,
            tick0: 0,
            dtick: dtick1,
            tickfont: { color: '#FFAF1F' },
            titlefont: { color: '#FFAF1F' },
            rangemode: 'tozero'
        },
        yaxis2: {
            title: variables.yaxis2,
            overlaying: 'y',
            side: 'right',
            range: yaxis2Range,
            tick0: 0,
            dtick: dtick2,
            tickfont: { color: '#0000FF' },
            titlefont: { color: '#0000FF' },
            automargin: true,
            position: 1,
            rangemode: 'tozero'
        },
        hovermode: 'x unified',
        legend: { orientation: 'h', x: 0.5, y: 1.1 },
        dragmode: chartRelayout?.dragmode,
        margin: { t: 80, r: 40, l: 60, b: (format === DATE_FORMAT ? 40 : 60 )}
    };
};


export const createLayout = (chartTitle, yaxisTitle, chartSubtitle, dates, format, dataTraces, chartRelayout, infoChartSize, isCollapsedFormGroup, chartType) => {
    const isMultiVariable = chartType === MULTI_VARIABLE_CHART;
    const yaxisRange = isMultiVariable
        ? [chartRelayout?.yaxisStart || MIN_Y_INDEX, chartRelayout?.yaxisEnd || MAX_Y_INDEX]
        : [chartRelayout?.yaxisStart || Math.min([dataTraces[0], dataTraces[1]]), chartRelayout?.yaxisEnd || Math.max([dataTraces[0], dataTraces[1]])];

    const layout =  {
        width: infoChartSize.widthResizable - 10,
        height: infoChartSize.heightResizable - (isCollapsedFormGroup ? 140 : 400),
        title: {
            text: chartTitle,
            x: 0.05, // Posiziona il titolo a sinistra
            xanchor: 'left' // Ancora il titolo a sinistra
        },
        xaxis: {
            tickformat: format !== DATE_FORMAT ? '%Y-%m-%d %H:%M:%S' : '%Y-%m-%d',
            tickangle: -20,
            range: [chartRelayout?.startDate || Math.min(...dates), chartRelayout?.endDate || Math.max(...dates)],
            ticks: 'inside',
            ticklen: 5,
            tickwidth: 1,
            tickcolor: '#000'
        },
        yaxis: {
            range: yaxisRange,
            ...(isMultiVariable && { // Aggiunge tickvals solo per multi-variable
                tickvals: [MIN_Y_INDEX, -2, -1.5, -0.5, 0.5, 1.0, 1.5, 2.0, MAX_Y_INDEX]
            }),
            ...(!isMultiVariable && { // Aggiunge il title solo se non e multi-variable
                title: yaxisTitle
            }),
            tickformat: '.1f',
            ticks: 'inside',
            ticklen: 5,
            tickwidth: 1,
            tickcolor: '#000'
        },
        margin: { t: 80, r: 40, l: 60, b: (format === DATE_FORMAT ? 40 : 60 )},
        showlegend: true,
        hovermode: 'x unified',
        legend: { orientation: 'h', x: 0.5, y: 1.05 },
        dragmode: chartRelayout?.dragmode,
        annotations: [{
            x: - 0.02, // Stessa posizione x del titolo principale
            y: 1.08, // Posizione y leggermente sopra il titolo principale
            xref: 'paper',
            yref: 'paper',
            text: chartSubtitle,
            showarrow: false,
            align: 'left',
            font: {
                size: 12,  // Dimensione del sottotitolo
                color: 'gray'
            }
        }]
    };
    return layout;
};

