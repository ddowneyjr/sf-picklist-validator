# Salesforce Picklist Validator

A command-line tool to compare and validate picklist field values between two Salesforce orgs. This tool helps ensure picklist metadata is synchronized across environments (e.g., sandbox to production, dev to QA).

## Features

- Compare picklist values between two Salesforce orgs
- Validate multiple picklist fields at once
- Identify discrepancies including:
  - Missing values (exist in source but not target)
  - Extra values (exist in target but not source)
  - Label mismatches
  - Default value mismatches
- Color-coded output for easy identification of issues
- Read-only operations - safe to run without risk of modifying metadata

## Prerequisites

- Node.js (v14 or higher)
- Salesforce CLI (`sf`) installed and configured
- Authenticated sessions for both orgs you want to compare

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd sf-picklist-validator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your org aliases:
```env
SF_ORG_A_ALIAS=your-source-org-alias
SF_ORG_B_ALIAS=your-target-org-alias
```

## Authentication

Before running the tool, authenticate with both Salesforce orgs:

```bash
sf org login web -a your-source-org-alias
sf org login web -a your-target-org-alias
```

## Usage

Run the validator:

```bash
node index.js
```

### Interactive Prompts

1. **Enter Object API Name**: Type the API name of the object (e.g., `Account`, `Contact`, `CustomObject__c`)
2. **Select Picklist Fields**: Use the arrow keys and spacebar to select one or more picklist fields
   - **Spacebar**: Select/deselect individual fields
   - **'a' key**: Toggle all fields at once
   - **'i' key**: Invert current selection
   - **Enter**: Confirm selection and start validation

### Example Output

```
RESULTS FOR: Account_Funding_Type__c
---------------------------------------------------------
[MATCH]    Picklist_Value1         | Validated
[MATCH]    Picklist_Value2         | Validated
[MATCH]    Picklist_Value3         | Validated
[MISSING]  Picklist_Value4         | Not found in Org B
[EXTRA]    Picklist_Value5         | Exists in Org B only
[EXTRA]    Picklist_Value6         | Exists in Org B only
---------------------------------------------------------
✖ ATTENTION: Found 3 discrepancy(ies).
```

### Color Legend

- **Green [MATCH]**: Values are identical in both orgs
- **Yellow [MISMATCH]**: Values exist in both orgs but have different labels or defaults
- **Red [MISSING]**: Values exist in source org but missing in target org
- **Magenta [EXTRA]**: Values exist in target org but not in source org

## Project Structure

```
sf-picklist-validator/
├── index.js                 # Main application file
├── lib/
│   ├── connection.js        # Salesforce authentication
│   ├── metadata.js          # Metadata API operations
│   └── comparator.js        # Comparison logic
├── .env                     # Environment variables (not committed)
├── package.json
└── README.md
```

## Supported Field Types

- Standard Picklist fields
- Multi-select Picklist fields
- Custom Picklist fields

## Safety

This tool is **read-only** and performs no write operations. It:
- Only reads metadata using `metadata.read()`
- Does not deploy, update, or delete any metadata
- Does not modify any data in your Salesforce orgs
- Safe to run in production environments

## Limitations

- Only works with picklist fields (not record types, validation rules, etc.)
- Requires active Salesforce CLI authentication
- Compares field-level metadata only (not record-type-specific picklist values)

## Troubleshooting

### "Could not find CLI session for alias"
- Ensure you've authenticated with both orgs using `sf org login web`
- Verify the org aliases in your `.env` file match your authenticated sessions
- Check active sessions with `sf org list`

### "No metadata returned for [field]"
- Verify the field API name is correct
- Ensure the field exists in both orgs
- Check that your user has permission to read field metadata

### "No picklist fields found"
- Verify the object API name is spelled correctly
- Ensure the object exists in the org
- Confirm the object has picklist fields



