import querystring from 'querystring';
import React from 'react';
import axios from "axios";
import DatabaseLocator from '../DatabaseLocator/DatabaseLocator';
import LandExplorer from '../LandExplorer/LandExplorer';
import ExpressionExplorer from '../ExpressionExplorer/ExpressionExplorer';
import Container from "react-bootstrap/Container";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import './App.css';

function App() {
    const [lands, setLands] = React.useState([]);
    const [land, setLand] = React.useState([]);
    const [expression, setExpression] = React.useState(null);

    const setLocation = (location, success) => {
        if (location !== "") {
            localStorage.setItem('dbFile', location.toString());
        } else {
            localStorage.removeItem('dbFile');
        }

        if (success) {
            axios.get(`/api/lands`).then(res => {
                setLands(res.data);
                setLand([]);
                setExpression(null);
            });
        }
    };

    const getLand = (landId, params) => {
        if (landId === null) {
            setLand(null);
            setExpression(null);
        } else {
            axios.get(`/api/land?id=${landId}&${querystring.stringify(params)}`).then(res => {
                console.log(`Loaded land #${landId}`);
                setLand(res.data);
                setExpression(null);
            });
        }
    };

    const getExpression = expressionId => {
        if (expressionId === null) {
            setExpression(null);
        } else {
            axios.get(`/api/expression?id=${expressionId}`).then(res => {
                console.log(`Loaded expression #${expressionId}`);
                setExpression(res.data);
            });
        }
    };

    const getReadable = expressionId => {
        if (expressionId !== null) {
            axios.get(`/api/readable?id=${expressionId}`).then(res => {
                console.log(`Got readable #${expressionId}`);
                getExpression(expressionId);
            });
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <Container fluid>
                    <Row className="align-items-center">
                        <Col md="3">
                            <h1 className="px-3">MWI Client</h1>
                        </Col>
                        <Col md="9">
                            <DatabaseLocator location={localStorage.getItem('dbFile') || ""} setLocation={setLocation} />
                        </Col>
                    </Row>
                </Container>
            </header>

            <Container fluid className="App-panels">
                <Row>
                    <Col md="3" className="py-3">
                        <LandExplorer lands={lands} getLand={getLand} />
                    </Col>
                    <Col md="9" className="py-3">
                        <ExpressionExplorer land={land} expression={expression} getExpression={getExpression} getReadable={getReadable} />
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default App;
