const chalk = require("chalk");

async function fetchPicklistMetadata(conn, fullName) {
  try {

    const metadata = await conn.metadata.read("CustomField", [fullName]);

    if (!metadata || metadata.length === 0) {
      console.log(
        chalk.red(
          `  -- Error: No metadata returned for ${fullName}. Check API Name spelling.`,
        ),
      );
      return { type: "CustomField", name: fullName, values: [] };
    }

    // JSForce returns an array when using metadata.read() with an array parameter
    // Extract the first element which contains the actual field metadata
    const fieldMetadata = Array.isArray(metadata) ? metadata[0] : metadata;

    const extractedValues = extractValues(fieldMetadata);

    return {
      type: "CustomField",
      name: fullName,
      values: extractedValues,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch metadata for ${fullName}: ${error.message}`,
    );
  }
}

/**
 * Deep extraction logic to find the 'value' array within a CustomField
 */
function extractValues(metadata) {
  if (!metadata) return [];

  // 1. The Standard Path: valueSet.valueSetDefinition.value
  let values = metadata.valueSet?.valueSetDefinition?.value;

  // 2. The Legacy/Alternate Path: picklist.picklistValues
  if (!values && metadata.picklist?.picklistValues) {
    values = metadata.picklist.picklistValues;
  }

  // 3. The "Deep Search" Fallback: In some API versions, it's inside an array called 'values'
  if (!values && metadata.valueSet?.values) {
    values = metadata.valueSet.values;
  }

  if (!values) return [];

  // Always return an array (JSForce returns an object if there's only 1 value)
  return Array.isArray(values) ? values : [values];
}

module.exports = { fetchPicklistMetadata };
