import React from "react";
import './LandFilters.css';
import Accordion from "react-bootstrap/Accordion";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import FormLabel from "react-bootstrap/FormLabel";
import FormControl from "react-bootstrap/FormControl";
import FormGroup from "react-bootstrap/FormGroup";

function LandFilters({index, land, getLand}) {
    let slideTimer;

    const load = params => {
        clearTimeout(slideTimer);
        slideTimer = setTimeout(_ => {
            getLand(land.id, params);
        }, 400);
    };

    const setMinRelevance = event => {
        load({
            minRelevance: event.target.value,
            minDepth: document.getElementById("formDepth" + land.id).value
        });
    };

    const setMinDepth = event => {
        load({
            minRelevance: document.getElementById("formRelevance" + land.id).value,
            minDepth: event.target.value
        })
    };

    return (
        <Accordion.Collapse eventKey={index}>
            <Card.Body>
                <Form>
                    <FormGroup controlId={"formRelevance" + land.id}>
                        <FormLabel>Minimum relevance</FormLabel>
                        <FormControl type="range" min={land.minRelevance} max={land.maxRelevance} list={"rel_" + land.id}
                                     className="form-control-range" onChange={setMinRelevance}/>
                        <datalist id={"rel_" + land.id}>
                            <option value={land.minRelevance} label={land.minRelevance}/>
                            <option value={land.maxRelevance} label={land.maxRelevance}/>
                        </datalist>
                    </FormGroup>
                    <FormGroup controlId={"formDepth" + land.id}>
                        <FormLabel>Maximum depth</FormLabel>
                        <FormControl type="range" min={land.minDepth} max={land.maxDepth} list={"dep_" + land.id} onChange={setMinDepth}/>
                        <datalist id={"dep_" + land.id}>
                            <option value="0" label="0"/>
                            <option value="1"/>
                            <option value="2"/>
                            <option value="3" label="3"/>
                        </datalist>
                    </FormGroup>
                </Form>
                <p>{land.description}</p>
            </Card.Body>
        </Accordion.Collapse>
    );
}

export default LandFilters;
