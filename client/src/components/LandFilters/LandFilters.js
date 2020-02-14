import React, {useEffect, useRef, useState} from "react";
import './LandFilters.css';
import Accordion from "react-bootstrap/Accordion";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import FilterSlider from "./FilterSlider";

function LandFilters({index, land, getLand}) {
    let timer;
    const initiated = useRef(true);
    const [minRelevance, setMinRelevance] = useState(land.minRelevance);
    const [maxDepth, setMaxDepth] = useState(land.maxDepth);

    useEffect(() => {
        if (initiated.current) {
            initiated.current = false;
            return;
        }
        load();
    }, [minRelevance, maxDepth]);

    const applyRelevance = (value) => {
        delay(setMinRelevance, value);
    };

    const applyDepth = (value) => {
        delay(setMaxDepth, value);
    };

    const delay = (callback, value) => {
        clearTimeout(timer);
        timer = setTimeout((value) => {
            callback(value);
        }, 400, value);
    }

    const load = () => {
        getLand(land.id, {minRelevance: minRelevance, maxDepth: maxDepth})
    };

    return (
        <Accordion.Collapse eventKey={index}>
            <Card.Body>
                <Form>
                    <FilterSlider label="Minimum relevance"
                                  min={land.minRelevance}
                                  max={land.maxRelevance}
                                  defaultValue={land.minRelevance}
                                  apply={applyRelevance}/>

                    <FilterSlider label="Maximum depth"
                                  min={land.minDepth}
                                  max={land.maxDepth}
                                  defaultValue={land.maxDepth}
                                  apply={applyDepth}/>
                </Form>
                <p className="text-muted">{land.description}</p>
            </Card.Body>
        </Accordion.Collapse>
    );
}

export default LandFilters;
