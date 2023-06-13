import schema from "../src/sign-in-schema.json"
import data from "./sign-in-payload.json"
import incorrectdata from "./incorrect-payload.json"
import { SiwsTypedData } from "../src/client";


function validateData(schemaObj: any, dataObj: any): boolean {

      const obj = JSON.parse(JSON.stringify(dataObj));
      try
      {
        let typedData= new SiwsTypedData(obj.domain as any, obj.message as any);
        return true
      }
      catch (e) {
        return false
      }
    }

describe('Data validation', () => {
  it('validates correct data correctly', () => {
    expect(validateData(schema, data)).toBe(true);
  });

  it('detects incorrect data', () => {
    expect(validateData(schema, incorrectdata)).toBe(false);
  });
});
