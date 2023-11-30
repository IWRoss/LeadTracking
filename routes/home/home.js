const express = require("express"),
  router = express.Router();

const path = require("path");

const {
  listRecentlyInteractedLeads,
  listPrettyRecentlyInteractedLeads,
  listActivityTypes,
} = require("../../controllers/copper");

/**
 * GET *
 *
 * Almost all GET requests are redirected to the React app. Exceptions are
 * handled inside the closure below.
 */
router.get("*", async (request, response) => {
  /**
   * Exceptions
   *
   * Format:
   * if (request.baseUrl === "/some/endpoint") {
   *  // Do something
   * }
   */

  if (request.baseUrl === "/raw-leads") {
    const leads = await listRecentlyInteractedLeads();

    response.json(leads);

    return;
  }

  if (request.baseUrl === "/leads") {
    const leads = await listPrettyRecentlyInteractedLeads();

    response.json(leads);

    return;
  }

  if (request.baseUrl === "/activities") {
    const activities = await listActivityTypes();

    response.json(activities);

    return;
  }

  // If request passed the exceptions above, redirect to the React app
  response.sendFile(path.join(__dirname, "../../client/build", "index.html"));
});

module.exports = router;
