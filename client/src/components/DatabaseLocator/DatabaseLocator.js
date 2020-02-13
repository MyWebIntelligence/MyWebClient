import React, {useEffect} from "react";
import axios from "axios";
import FormControl from "react-bootstrap/FormControl";
import InputGroup from "react-bootstrap/InputGroup";

function DatabaseLocator({location, setLocation}) {
    /**
     * Test connection once at first render
     */
    useEffect(() => {
        testConnection()
    }, []);

    const [success, setSuccess] = React.useState(false);
    const [dbFile, setDbFile] = React.useState(location || "");

    const testConnection = () => {
        if (dbFile !== "") {
            axios.get('/api/connect?db=' + encodeURI(dbFile.toString())).then(res => {
                setSuccess(res.data);
                setLocation(dbFile, res.data);
            });
        } else {
            setSuccess(false);
            setLocation(dbFile, false);
        }
    };

    return (
        <div className="py-3">
            <InputGroup>
                <InputGroup.Prepend>
                    <InputGroup.Text><i className="fas fa-database"> </i></InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl id="dbLocation" onChange={e => setDbFile(e.target.value)} onBlur={testConnection} value={dbFile} placeholder="Paste database file path here" />
                <InputGroup.Append>
                    <InputGroup.Text>
                        <i className={success ? "text-success fas fa-check-circle" : "text-danger fas fa-exclamation-circle"}> </i>
                    </InputGroup.Text>
                </InputGroup.Append>
            </InputGroup>
        </div>
    );
}

export default DatabaseLocator;
