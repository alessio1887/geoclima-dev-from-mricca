// FormGroup.js
import React from 'react';
import { Button, ButtonGroup, Glyphicon, Panel, Grid, Label} from 'react-bootstrap';
import SelectVariableTab from '../buttons/SelectVariableTab';
import FixedRangeManager from '../../components/datepickers/FixedRangeManager';
import FreeRangeManager from '../../components/datepickers/FreeRangeManager';
import Message from '@mapstore/components/I18N/Message';
import moment from 'moment';
import momentLocaliser from 'react-widgets/lib/localizers/moment';
momentLocaliser(moment);
import { FIXED_RANGE, FREE_RANGE }  from '../../utils/VariabiliMeteoUtils';

const InfoChartForm = ({
    tabList,
    tabVariables,
    onChangeChartVariable,
    activeTab, // Riceve direttamente il valore di activeTab
    onChangeTab,
    activeRangeManager,
    firstAvailableDate,
    lastAvailableDate,
    toData,
    periodType,
    periodTypes,
    onChangeFixedRangeTodata,
    onChangePeriod,
    infoChartSize,
    timeUnit,
    fromData,
    onChangeFromData,
    onChangeToData,
    handleApplyPeriod,
    variable,
    isInteractionDisabled,
    onSetRangeManager,
    alertMessage,
    toDataSelected,
    fromDataSelected
}) => {
    const handleChangePeriod = (newPeriodType) => {
        onChangePeriod(newPeriodType);
        this.handleApplyPeriod(null, null, newPeriodType);
    };
    const handleChangeTab = (newIdTab) => {
        onChangeTab(newIdTab);
        handleApplyPeriod(tabVariables.find(tab => tab.id === newIdTab).variables, newIdTab, null);
    };
    const switchRangeManager = () => {
        const newRangeManager = activeRangeManager === FIXED_RANGE ? FREE_RANGE : FIXED_RANGE;
        onSetRangeManager(newRangeManager);
    };
    const updateSingleVariable = (selectedVariable, newIdTab) => {
        onChangeChartVariable(newIdTab, [selectedVariable]);
        handleApplyPeriod([selectedVariable], newIdTab);
    };
    return (
        <Panel className="infochart-panel">
            <Grid fluid style={{ padding: 0 }}>
                <Label className="labels-infochart"><Message msgId="infochart.selectMeteoVariable" /></Label>
                <SelectVariableTab
                    idContainer="infochart-dropdown-container"
                    activeTab={activeTab}
                    tabList={tabList}
                    onChangeSingleVariable={updateSingleVariable}
                    onChangeMultiVariable={onChangeChartVariable}
                    onChangeTab={handleChangeTab}
                    isInteractionDisabled={false}
                />
                {activeRangeManager === FIXED_RANGE ? (
                    <FixedRangeManager
                        minDate={firstAvailableDate}
                        maxDate={lastAvailableDate}
                        toData={toData}
                        periodType={periodType}
                        periodTypes={periodTypes}
                        onChangeToData={onChangeFixedRangeTodata}
                        onChangePeriod={handleChangePeriod}
                        isInteractionDisabled={isInteractionDisabled}
                        styleLabels="labels-infochart"
                        classAttribute="infochart-fixedrangemanager-action"
                        widthPanel={infoChartSize.widthResizable}
                        format={timeUnit}
                    />
                ) : (
                    <FreeRangeManager
                        minDate={firstAvailableDate}
                        maxDate={lastAvailableDate}
                        fromData={fromData}
                        toData={toData}
                        onChangeFromData={onChangeFromData}
                        onChangeToData={onChangeToData}
                        isInteractionDisabled={isInteractionDisabled}
                        styleLabels="labels-infochart"
                        lablesType="gcapp.freeRangePicker"
                        classAttribute="infochart-freerangemanager-action"
                        widthPanel={infoChartSize.widthResizable}
                        format={timeUnit}
                    />
                )}
                <ButtonGroup className="button-group-wrapper">
                    <Button className="rangepicker-button" onClick={() => handleApplyPeriod(variable)} disabled={isInteractionDisabled}>
                        <Glyphicon glyph="calendar" /><Message msgId="gcapp.applyPeriodButton" />
                    </Button>
                    <Button className="rangepicker-button" onClick={switchRangeManager} disabled={isInteractionDisabled}>
                        <Message msgId={activeRangeManager === FIXED_RANGE
                            ? "gcapp.fixedRangePicker.dateRangeButton"
                            : "gcapp.freeRangePicker.dateRangeButton"} />
                    </Button>
                </ButtonGroup>
                {alertMessage && (
                    <div className="alert-date" >
                        <strong><Message msgId="warning" /></strong>
                        <span><Message msgId={alertMessage}
                            msgParams={{
                                toData: toDataSelected,
                                fromData: fromDataSelected,
                                minDate: moment(firstAvailableDate).format(timeUnit),
                                maxDate: moment(lastAvailableDate).format(timeUnit)
                            }} /></span>
                    </div>
                )}
            </Grid>
        </Panel>
    );
};

export default InfoChartForm;
