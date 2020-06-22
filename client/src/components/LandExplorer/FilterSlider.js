import React, {useEffect, useState} from 'react';
import FormGroup from 'react-bootstrap/FormGroup';
import FormLabel from 'react-bootstrap/FormLabel';
import FormControl from 'react-bootstrap/FormControl';
import {Badge} from 'react-bootstrap';
import "./FilterSlider.css";

function FilterSlider({label, min, max, defaultValue, apply}) {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    const handleChange = event => {
        setValue(event.target.value);
        apply(event.target.value);
    };

    return (
        <FormGroup>
            <FormLabel>{label} <Badge pill variant="primary">{value}</Badge></FormLabel>
            <FormControl type="range" min={min} max={max} className="form-control-range" value={value} onChange={handleChange}/>
        </FormGroup>
    );
}

export default FilterSlider;