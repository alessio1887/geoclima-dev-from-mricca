/**
 * Copyright 2024, Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import DateAPI, { DATE_FORMAT } from './ManageDateUtils';
import moment from 'moment';
import momentLocaliser from 'react-widgets/lib/localizers/moment';
momentLocaliser(moment);

// type of range picher
export const FIXED_RANGE = "fixed_range_picker";
export const FREE_RANGE = "free_range_picker";
export const SPI_SPEI_CHART = "spi_spei_chart";
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

export const getChartActive = (tabSelected) => {
    const chartList = tabSelected.chartList || tabSelected.variables[0]?.chartList || [];
    if (chartList.length > 0) {
        return chartList.find(chart => chart.active) || chartList[0];
    }
    return tabSelected.variables[0];
};

// backgroundBands may be defined either on the chart or on the tab level.
// We pass both chartActive and tabSelected to handle both cases.
export const getBackgroundBands = (chartActive, tabSelected) => {
    if (Array.isArray(chartActive?.backgroundBands) && chartActive.backgroundBands.length > 0) {
        return chartActive.backgroundBands;
    }
    if (Array.isArray(tabSelected?.backgroundBands) && tabSelected.backgroundBands.length > 0) {
        return tabSelected.backgroundBands;
    }
    if (Array.isArray(tabSelected?.variables) && tabSelected.variables.length > 0) {
        return tabSelected.variables[0]?.backgroundBands || [];
    }
    return [];
};


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

/**
 * Returns an array of objects with cumulative values calculated
 * for a specified variable and its corresponding climate value.
 */
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

/**
 * Formats an array of data objects by normalizing the date and rounding values.
 * Returns a new array with formatted dates and numeric values for a given variable
 * and its corresponding climate value.
 */
export function formatVariableData(values, propVariable) {
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
    } else if (screenWidth >= 450 && screenHeight >= 450 && screenWidth <= screenHeight) {
        y = -80;
        const xPositionA = -55;
        const xPositionB = - (Math.max(screenWidth, screenHeight) / 20);
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
export const createVariableLineTraces = (dataSetDefinitions, dates, dataFetched) => {
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

export const createObservedAndClimatologicalTraces = (traceParams, dates, dataFetched, unitPrecipitazione, hideClimatologicalTrace = false
) => {
    const chartParams = traceParams.chartActive ?? traceParams.variables[0];
    const chartVariable = traceParams.variables[0].id;
    const unit = chartParams.unit;
    const propVariable = ST_VALUE + chartVariable;

    const chartData = unit === unitPrecipitazione
        ? formatDataCum(dataFetched, propVariable)
        : formatVariableData(dataFetched, propVariable);

    const currentYearLabel = hideClimatologicalTrace ?  traceParams.variables[0].name : "Anno in corso " + (unit || "");

    const observedData = chartData.map(item => item[propVariable]);
    const climatologicalData = chartData.map(item => item.st_value_clima);

    const traces = [];

    if (!hideClimatologicalTrace) {
        const climaLabel = "Climatologia " + (unit || "");
        const fillTraces = fillAreas(dates, observedData, climatologicalData, chartParams, unitPrecipitazione);
        const trace1 = {
            x: dates,
            y: climatologicalData,
            mode: 'lines',
            name: climaLabel,
            line: chartParams.chartStyle1
        };
        traces.push(trace1, ...fillTraces);
    }
    const trace2 = {
        x: dates,
        y: observedData,
        mode: 'lines',
        name: currentYearLabel,
        line: chartParams.chartStyle2 || chartParams.chartStyle
    };
    traces.push(trace2);

    return traces;
};

export const createCumulataBarTraces = (traceParams, times, dataFetched) => {
    const chartParams = traceParams.chartActive ?? traceParams;
    const chartVariable = traceParams.variables[0].id;
    const propVariable = ST_VALUE + chartVariable;

    // Estrae le precipitazioni e le converte in numeri
    const precipitations = dataFetched.map(item => parseFloat(parseFloat(item[propVariable]).toFixed(1)));
    const cumulativePrecip = formatDataCum(dataFetched, propVariable).map(item => item[propVariable]);

    const barStyle = chartParams.chartStyle1 ? { ...chartParams.chartStyle1 } : { color: '#FFAF1F', opacity: 0.6 };

    // Traccia a barre per la precipitazione istantanea
    const trace1 = {
        x: times,
        y: precipitations,
        type: 'bar',
        name: chartParams.yaxis,
        marker: barStyle
        // marker: { color: '#ff821f', opacity: 0.6 }
    };

    // Traccia a linea per la precipitazione cumulata (asse y secondario)
    const trace2 = {
        x: times,
        y: cumulativePrecip,
        type: 'scatter',
        mode: 'lines',
        name: chartParams.yaxis2,
        line: chartParams.chartStyle2,
        yaxis: 'y2'
    };

    return [trace1, trace2];
};

/**
 * Generates Plotly line chart traces for forecast data based on variable definitions.
 *
 * @param {Array} dataSetDefinitions - List of variable definitions with `id`, `name`, and optional `chartStyle`.
 * @param {Array} dataFetched - Array with forecast data, each item containing a `previsioni` array.
 * @param {string} dateFormat - Format string for the output dates (e.g., 'YYYY-MM-DD').
 * @returns {Array} Array of Plotly-compatible trace objects.
 */
export const createAIBPrevTraces = (dataSetDefinitions, dataFetched, dateFormat) => {
    if (!dataFetched?.length || !dataFetched[0]?.previsioni?.length) {
        return [];
    }

    const forecastList = dataFetched[0].previsioni;
    const dates = DateAPI.extractPrevDates(dataFetched, dateFormat);

    return dataSetDefinitions
        .filter(variable => {
            return forecastList.some(entry => entry[variable.id] !== null && entry[variable.id] !== undefined);
        })
        .map((variable, index) => {
            const values = forecastList.map(entry =>
                entry[variable.id] !== null && entry[variable.id] !== undefined
                    ? parseFloat(Number(entry[variable.id]).toFixed(5))
                    : null
            );

            const lineStyle = variable.chartStyle && Object.keys(variable.chartStyle).length
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


export const createCumulataBarLayout = (traceParams, chartTitle, traces, dates, format, chartRelayout, infoChartSize, isCollapsedFormGroup) => {
    const chartParams = traceParams.chartActive ?? traceParams;
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
            title: chartParams.yaxis,
            range: yaxisRange,
            tick0: 0,
            dtick: dtick1,
            tickfont: { color: '#FFAF1F' },
            titlefont: { color: '#FFAF1F' },
            rangemode: 'tozero'
        },
        yaxis2: {
            title: chartParams.yaxis2,
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

export const getBandAnnotations = (backgroundBands) => {
    return Array.isArray(backgroundBands)
        ? backgroundBands
            .filter(b => b.min !== undefined && b.max !== undefined && b.class)
            .map(b => ({
                x: 0.02,
                xref: 'paper',
                y: (b.min + b.max) / 2,
                yref: 'y',
                text: b.class,
                showarrow: false,
                font: { size: 10, color: 'black' },
                align: 'left'
            }))
        : [];
};

export const getBandTickvals = (backgroundBands) => {
    return Array.isArray(backgroundBands)
        ? [...new Set(
            backgroundBands
                .flatMap(b => [b.min, b.max])
                .filter(v => typeof v === 'number')
        )].sort((a, b) => a - b)
        : [];
};

export const getXaxis = (dates, format, chartRelayout, infoChartSize) => {
    let xAxis = {
        tickformat: format !== DATE_FORMAT ? '%Y-%m-%d %H:%M:%S' : '%Y-%m-%d',
        tickangle: -20,
        range: [
            chartRelayout?.startDate || Math.min(...dates),
            chartRelayout?.endDate || Math.max(...dates)
        ],
        ticks: 'inside',
        ticklen: 5,
        tickwidth: 1,
        tickcolor: '#000',
        automargin: true
    };
    const shouldAddXTickvals =
        dates.length <= 4 ||
        (dates.length > 4 && dates.length <= 10 && infoChartSize?.widthResizable > 880);

    if (shouldAddXTickvals) {
        xAxis.tickvals = dates;
    }
    return xAxis;
};

export const getYaxis = (yaxisTitle, yaxisRange, yTickvals) => {
    let yAxis = {
        range: yaxisRange,
        title: yaxisTitle,
        tickformat: '.1f',
        ticks: 'inside',
        automargin: true,
        ticklen: 5,
        tickwidth: 1,
        tickcolor: '#000'
    };

    if (yTickvals && yTickvals.length > 0) {
        yAxis.tickvals = yTickvals;
    }
    return yAxis;
};

export const createLayout = (
    chartTitle,
    yaxisTitle,
    locationLabel,
    dates,
    format,
    dataTraces,
    chartRelayout,
    infoChartSize,
    isCollapsedFormGroup,
    backgroundBands = []
) => {
    const yaxisRange = [
        chartRelayout?.yaxisStart || Math.min(...dataTraces.flatMap(t => t.y).filter(Number.isFinite)),
        chartRelayout?.yaxisEnd || Math.max(...dataTraces.flatMap(t => t.y).filter(Number.isFinite))
    ];

    const bandAnnotations = getBandAnnotations(backgroundBands);
    const xAxis = getXaxis(dates, format, chartRelayout, infoChartSize);
    const yAxis = getYaxis(yaxisTitle, yaxisRange, getBandTickvals(backgroundBands));

    return {
        width: infoChartSize.widthResizable - 10,
        height: infoChartSize.heightResizable - (isCollapsedFormGroup ? 140 : 400),
        title: {
            text: chartTitle + (locationLabel ? ` - ${locationLabel}` : ''),
            x: 0.05,
            xanchor: 'left'
        },
        xaxis: xAxis,
        yaxis: yAxis,
        margin: {
            t: isCollapsedFormGroup ? 110 : 80,
            r: 40,
            l: 60,
            b: format === DATE_FORMAT ? 40 : 60
        },
        showlegend: true,
        hovermode: 'x unified',
        legend: {
            orientation: 'h',
            x: 0.5,
            y: 1.05
        },
        dragmode: chartRelayout?.dragmode,
        annotations: bandAnnotations
    };
};


/**
 * Checks if the provided data array contains relevant values for the requested variables,
 * returning an object with the detailed data status.
 *
 * @param {Array} data The data array received from the API call.
 * @param {object} infoChartParams The infoChartData object from the Redux state, containing 'variables'.
 * @returns {object} An object with properties:
 * - hasData: boolean (true if there is overall plottable data)
 * - isAibNested: boolean (true if the response is of AIB nested type)
 * - hasObservatoData?: boolean (only if isAibNested is true: true if 'osservato' contains valid data)
 * - hasPrevisioniData?: boolean (only if isAibNested is true: true if 'previsioni' contains valid data)
 */
export const containsValidChartData  = (data, infoChartParams) => {
    // 1. Base check
    if (!Array.isArray(data) || data.length === 0) {
        return { hasData: false, isAibNested: false };
    }

    // 2. Parse the requested variables from the "variables" string
    const requestedVariables = infoChartParams.variables
        ? infoChartParams.variables.split(',').map(v => v.trim())
        : [];

    if (requestedVariables.length === 0) {
        return { hasData: false, isAibNested: false };
    }
    // Helper function
    const isNullOrUndefined = (val) => val === null || val === undefined;

    // 3. Determine the response typology based on the first element of the 'data' array.
    const firstDataItem = data[0];
    const hasObservatoArrayAtFirstItem = firstDataItem && Array.isArray(firstDataItem.osservato);
    const hasPrevisioniArrayAtFirstItem = firstDataItem && Array.isArray(firstDataItem.previsioni);
    const isAibNestedResponse = hasObservatoArrayAtFirstItem || hasPrevisioniArrayAtFirstItem;
    // Initialize flags for AIB nested data types
    let observatoHasValidData = false;
    let previsioniHasValidData = false;
    let overallHasValidData = false;

    if (isAibNestedResponse) {
        data.forEach(item => {
            if (hasObservatoArrayAtFirstItem) {
                const nestedObservatoArray = item.osservato || [];
                if (nestedObservatoArray.length > 0) {
                    const foundInObservato = nestedObservatoArray.some(subItem => {
                        return requestedVariables.some(variable => {// For 'osservato' (historical), variables use the 'st_value_' prefix
                            const keyName = `st_value_${variable}`;
                            const value = subItem[keyName];
                            return !isNullOrUndefined(value);
                        });
                    });
                    if (foundInObservato) {
                        observatoHasValidData = true; // At least one valid value found in 'osservato'
                    }
                }
            }
            if (hasPrevisioniArrayAtFirstItem) {
                const nestedPrevisioniArray = item.previsioni || [];
                if (nestedPrevisioniArray.length > 0) {
                    const foundInPrevisioni = nestedPrevisioniArray.some(subItem => {
                        return requestedVariables.some(variable => {
                            // For 'previsioni' (forecast), variables do NOT use the 'st_value_' prefix
                            const keyName = variable;
                            const value = subItem[keyName];
                            return !isNullOrUndefined(value);
                        });
                    });
                    if (foundInPrevisioni) {
                        previsioniHasValidData = true; // At least one valid value found in 'previsioni'
                    }
                }
            }
        });
        overallHasValidData = observatoHasValidData || previsioniHasValidData;
        return { // Returns a detailed object for AIB nested responses
            hasData: overallHasValidData,
            isAibNested: true,
            hasObservatoData: observatoHasValidData,
            hasPrevisioniData: previsioniHasValidData
        };

    }
    // Returns a detailed object for no AIB responses
    overallHasValidData = data.some(item => {
        return requestedVariables.some(variable => {
            const keyName = `st_value_${variable}`;
            const value = item[keyName];
            return !isNullOrUndefined(value);
        });
    });
    return { // Returns a simple object for flat responses
        hasData: overallHasValidData,
        isAibNested: false
    };
};
