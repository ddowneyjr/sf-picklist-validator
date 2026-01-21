const jsforce = require("jsforce");
const { execSync } = require("child_process");
require("dotenv").config();

/**
 * Fetches connection details from SF CLI and returns a JSForce connection.
 */
function getConnFromCLI(alias) {
  try {
    // Runs 'sf org display' which returns JSON containing the accessToken and instanceUrl
    const cmd = `sf org display --target-org ${alias} --json`;
    const result = JSON.parse(execSync(cmd, { encoding: "utf8" }));

    if (result.status !== 0) throw new Error(result.message);

    const { accessToken, instanceUrl } = result.result;

    return new jsforce.Connection({
      instanceUrl: instanceUrl,
      accessToken: accessToken,
    });
  } catch (error) {
    throw new Error(
      `Could not find CLI session for alias "${alias}". Run 'sf org login web -a ${alias}' first.`,
    );
  }
}

async function getAuthenticatedConnections() {
  const connA = getConnFromCLI(process.env.SF_ORG_A_ALIAS);
  const connB = getConnFromCLI(process.env.SF_ORG_B_ALIAS);

  return { connA, connB };
}

module.exports = { getAuthenticatedConnections };
