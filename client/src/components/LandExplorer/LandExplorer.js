import React from "react";
import LandFilters from '../LandFilters/LandFilters';
import './LandExplorer.css';
import Accordion from "react-bootstrap/Accordion";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

function LandExplorer({lands, getLand}) {

    const load = landId => {
        getLand(landId);
    };

    const notConnected  = <div>
        <h3 className="text-muted">Waiting for database connection...</h3>
    </div>;

    return (
        <Accordion defaultActiveKey="0">
        {lands.map((land, index) =>
            <Card key={index}>
                <Card.Header className="LandExplorer-header d-flex justify-content-between">
                    <Button value={land.id} variant="link" onClick={_ => load(land.id)}>{land.name}</Button>
                    <Accordion.Toggle as={Button} variant="link" eventKey={index}>
                        <i className="fas fa-cog m-1"> </i>
                    </Accordion.Toggle>
                </Card.Header>
                <LandFilters index={index} land={land} getLand={getLand}/>
            </Card>
        )}
        { lands.length > 0 || notConnected}
        </Accordion>
    );
};

export default LandExplorer;
