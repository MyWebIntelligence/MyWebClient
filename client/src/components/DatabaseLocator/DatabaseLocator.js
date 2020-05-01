import React, {useContext, useEffect} from 'react';
import {Context} from '../../app/Context';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';


function DatabaseLocator() {
    const context = useContext(Context);

    /**
     * Test connection once at first render
     */
    useEffect(() => {
        setTimeout(() => {
            context.setDb(localStorage.getItem('dbFile'));
        }, 1000);
    }, []);

    let stateClass = 'text-danger fas fa-exclamation-circle';

    if (context.connecting) {
        stateClass = 'text-warning fas fa-spinner spin';
    } else if (context.isConnected) {
        stateClass = 'text-success fas fa-check-circle';
    }

    return (
        <InputGroup>
            <InputGroup.Prepend>
                <InputGroup.Text><i className="fas fa-database" /></InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl id="dbLocation" onBlur={e => context.setDb(e.target.value)}
                         defaultValue={localStorage.getItem('dbFile')}
                         placeholder="Paste database file path here"/>
            <InputGroup.Append>
                <InputGroup.Text>
                    <i className={stateClass}> </i>
                </InputGroup.Text>
            </InputGroup.Append>
        </InputGroup>
    )
}

export default DatabaseLocator;
