/**
 * Compares two sets of picklist values (Metadata API format).
 * Handles CustomField values and GlobalValueSet values.
 */
function comparePicklists(valuesA, valuesB) {
  const report = {
    matches: [],
    mismatches: [],
    missingInB: [],
    extraInB: [],
  };

  // 1. Check everything in Source (Org A) against Target (Org B)
  valuesA.forEach((valA) => {
    const matchB = valuesB.find((v) => v.fullName === valA.fullName);

    if (!matchB) {
      // Value exists in A but not B
      report.missingInB.push({
        apiName: valA.fullName,
        label: valA.label,
        issue: "Missing in Org B",
      });
    } else {
      // Value exists in both - check for metadata drift
      const labelMismatch = valA.label !== matchB.label;
      const defaultMismatch = valA.default !== matchB.default;

      if (labelMismatch || defaultMismatch) {
        report.mismatches.push({
          apiName: valA.fullName,
          issue: labelMismatch ? "Label Mismatch" : "Default Value Mismatch",
          labelA: valA.label,
          labelB: matchB.label,
          detail: `Default: A(${valA.default}) vs B(${matchB.default})`,
        });
      } else {
        report.matches.push({
          apiName: valA.fullName,
          label: valA.label,
        });
      }
    }
  });

  // 2. Check for "Ghost" values (Exists in Org B but NOT in Org A)
  valuesB.forEach((valB) => {
    const matchA = valuesA.find((v) => v.fullName === valB.fullName);
    if (!matchA) {
      report.extraInB.push({
        apiName: valB.fullName,
        label: valB.label,
        issue: "Exists in Target only",
      });
    }
  });

  return report;
}

module.exports = { comparePicklists };
