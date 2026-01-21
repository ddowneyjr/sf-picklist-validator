const inquirer = require("inquirer");
const chalk = require("chalk");

// Import your custom modules from the lib folder
const { getAuthenticatedConnections } = require("./lib/connection");
const { fetchPicklistMetadata } = require("./lib/metadata");
const { comparePicklists } = require("./lib/comparator");

async function main() {
  console.clear();
  console.log(chalk.blue.bold("========================================="));
  console.log(chalk.blue.bold("   SALESFORCE PICKLIST VALIDATOR v1.0   "));
  console.log(chalk.blue.bold("=========================================\n"));

  try {
    // 1. Connection Phase
    console.log(chalk.yellow("Authenticating with Salesforce Orgs..."));
    const { connA, connB } = await getAuthenticatedConnections();
    console.log(chalk.green("✔ Both orgs connected successfully.\n"));

    // 2. Object Selection Phase
    const { objectName } = await inquirer.prompt([
      {
        type: "input",
        name: "objectName",
        message: "Enter Object API Name (e.g., Account, Case, Lead):",
        default: "Account",
        validate: (input) =>
          input.length > 0 ? true : "Object name is required.",
      },
    ]);

    // 3. Field Selection Phase
    console.log(chalk.gray(`Describing ${objectName}...`));
    const describe = await connA.sobject(objectName).describe();

    const picklistFields = describe.fields
      .filter((f) => f.type === "picklist" || f.type === "multipicklist")
      .map((f) => ({ name: `${f.label} (${f.name})`, value: f.name }));

    if (picklistFields.length === 0) {
      console.log(chalk.red(`No picklist fields found on ${objectName}.`));
      return;
    }

    const { targetFields } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "targetFields",
        message:
          "Select the picklist field(s) to validate (spacebar to select, 'a' to toggle all):",
        choices: picklistFields,
        validate: (input) =>
          input.length > 0 ? true : "You must select at least one field.",
        loop: false,
      },
    ]);

    // 4. Metadata Retrieval & Comparison Phase - Loop through each selected field
    console.log(chalk.yellow("\nFetching Metadata from both orgs..."));

    for (const targetField of targetFields) {
      const fullName = `${objectName}.${targetField}`;

      // Uses metadata.js logic to handle CustomFields vs GlobalValueSets
      const [dataA, dataB] = await Promise.all([
        fetchPicklistMetadata(connA, fullName),
        fetchPicklistMetadata(connB, fullName),
      ]);

      // 5. Comparison Phase
      // Uses comparator.js logic to find mismatches and ghost values
      const results = comparePicklists(dataA.values, dataB.values);

      // 6. Reporting Phase
      console.log(chalk.white.bgBlue.bold(`\n RESULTS FOR: ${targetField} `));
      console.log(
        chalk.gray("---------------------------------------------------------"),
      );

      // Output matches for confirmation
      results.matches.forEach((m) =>
        console.log(
          chalk.green(`[MATCH]    ${m.apiName.padEnd(25)} | Validated`),
        ),
      );

      // Output Mismatches (Labels/Defaults)
      results.mismatches.forEach((m) => {
        const detail = m.labelA
          ? `Label: "${m.labelA}" vs "${m.labelB}"`
          : m.detail;
        console.log(
          chalk.yellow(
            `[MISMATCH] ${m.apiName.padEnd(25)} | ${m.issue} (${detail})`,
          ),
        );
      });

      // Output Missing in Target (Org B)
      results.missingInB.forEach((m) =>
        console.log(
          chalk.red(`[MISSING]  ${m.apiName.padEnd(25)} | Not found in Org B`),
        ),
      );

      // Output Extra in Target (values only in Org B)
      results.extraInB.forEach((m) =>
        console.log(
          chalk.magenta(
            `[EXTRA]    ${m.apiName.padEnd(25)} | Exists in Org B only`,
          ),
        ),
      );

      // 7. Field Summary
      console.log(
        chalk.gray("---------------------------------------------------------"),
      );
      const totalIssues =
        results.mismatches.length +
        results.missingInB.length +
        results.extraInB.length;

      if (totalIssues === 0) {
        console.log(
          chalk.bold.green(
            `✔ SUCCESS: All ${results.matches.length} values are in sync!`,
          ),
        );
      } else {
        console.log(
          chalk.bold.red(`✖ ATTENTION: Found ${totalIssues} discrepancy(ies).`),
        );
      }
      console.log(); // Extra line break between fields
    }
  } catch (error) {
    console.error(chalk.red("\nFATAL ERROR:"), error.message);
    process.exit(1);
  }
}

main();
