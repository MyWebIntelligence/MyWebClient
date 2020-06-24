import React, {useContext} from 'react';
import './LandFilters.css';
import Form from 'react-bootstrap/Form';
import FilterSlider from './FilterSlider';
import {Context} from '../../app/Context';
import {delay} from '../../app/Util';

function LandFilters() {
    const context = useContext(Context);

    const onChangeRelevance = (value) => {
        delay(400, context.setCurrentRelevance, parseInt(value));
    };

    const onChangeDepth = (value) => {
        delay(400, context.setCurrentDepth, parseInt(value));
    };

    return (
        <div>
            <div className="h5 my-3">Filters</div>
            <div className="py-3 panel">
                <Form>
                    <FilterSlider label="Minimum relevance"
                                  min={context.minRelevance}
                                  max={context.maxRelevance}
                                  defaultValue={context.currentRelevance}
                                  apply={onChangeRelevance}/>

                    <FilterSlider label="Maximum depth"
                                  min={context.minDepth}
                                  max={context.maxDepth}
                                  defaultValue={context.currentDepth}
                                  apply={onChangeDepth}/>
                </Form>
            </div>
        </div>
    );
}

export default LandFilters;
