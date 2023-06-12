import Ajv2020 from "ajv/dist/2020"

import addFormats from 'ajv-formats';
// import { IData } from './types'; // Assume types are in a separate file
import schema from "../src/sign-in-schema.json"
import data from "./sign-in-payload.json"
import { SiwsTypedData } from "../src/client";

// import '@types/jest';


function validateData(schemaPath: string, dataPath: string): boolean {
    //   const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8')) as JSONSchemaType<IData>;
    //   const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as IData;
      const ajv = new Ajv2020({ allErrors: true, strict: false });
      addFormats(ajv);
    
      const validate = ajv.compile(schema);
      const obj = JSON.parse(JSON.stringify(data));
      let typedData= new SiwsTypedData(obj.domain as any, obj.message as any);

      const valid = validate(typedData);
    
      if (!valid) {
        console.log(validate.errors);
        return false;
      } else {
        return true;
      }
    }

describe('Data validation', () => {
  it('validates correct data correctly', () => {
    expect(validateData('correctSchema.json', 'correctData.json')).toBe(true);
  });

//   it('detects incorrect data', () => {
//     expect(validateData('correctSchema.json', 'incorrectData.json')).toBe(false);
//   });
});
