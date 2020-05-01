import React, {useContext} from 'react';
import {Context} from '../../app/Context';
import LandFilters from './LandFilters';
import './LandExplorer.css';
import {FormControl} from 'react-bootstrap';

function LandExplorer() {
    const context = useContext(Context);
    const notConnected = <option>Waiting for database connection...</option>;
    const currentId = context.currentLand !== null ? context.currentLand.id : null;

    const switchLand = event => {
        const id = parseInt(event.target.value);
        context.getLand(id);
        console.log(context);
    };

    return (
        <div>
            <FormControl as="select" onChange={switchLand} disabled={!context.isConnected} defaultValue={currentId}>
                {context.lands.map((land, index) => {
                    return (
                        <option key={index} value={land.id}>
                            {land.name}
                        </option>
                    )
                })}
                {context.lands.length > 0 || notConnected}
            </FormControl>
            {context.currentLand && <LandFilters landId={context.currentLand.id}/>}
        </div>
    );
}

export default LandExplorer;
