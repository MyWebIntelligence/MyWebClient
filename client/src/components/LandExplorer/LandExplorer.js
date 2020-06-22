import React, { useContext } from 'react';
import { Context } from '../../app/Context';
import LandFilters from './LandFilters';
import './LandExplorer.css';
import { FormControl } from 'react-bootstrap';
import TagExplorer from "../TagExplorer/TagExplorer";

function LandExplorer() {
    const context = useContext(Context);
    const notConnected = <option>Waiting for database connection...</option>;
    const currentId = context.currentLand !== null ? context.currentLand.id : null;

    const switchLand = event => {
        const id = parseInt(event.target.value);
        context.getLand(id);
    };

    return (
        <div>
            <div className="h5 my-3">Land</div>
            <div className="panel py-3">
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
                {context.currentLand && <p className="mt-2 text-muted">{context.currentLand.description}</p>}
            </div>

            {context.currentLand && <LandFilters/>}

            <TagExplorer/>
        </div>
    );
}

export default LandExplorer;
