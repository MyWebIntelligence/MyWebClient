import React, {useContext} from 'react';
import './LandFilters.css';
import Form from 'react-bootstrap/Form';
import FilterSlider from './FilterSlider';
import {Context} from '../../config/Context';

function LandFilters() {
    const context = useContext(Context);
    let timer;

    const onChangeRelevance = (value) => {
        delay(context.setCurrentRelevance, parseInt(value));
    };

    const onChangeDepth = (value) => {
        delay(context.setCurrentDepth, parseInt(value));
    };

    const delay = (callback, value) => {
        clearTimeout(timer);
        timer = setTimeout((value) => {
            callback(value);
        }, 400, value);
    };

    return (
        <div className="my-3 panel">
            <div className="h5 my-3">Filters</div>
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
            <hr/>
            <p className="text-muted">{context.currentLand.description}</p>
        </div>
    );
}

export default LandFilters;
