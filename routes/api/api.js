const express = require("express"),
  router = express.Router();

const {
  listRecentlyInteractedLeadsWithActivities,
  listActivityTypes,
  updateLeadStatus,
} = require("../../controllers/copper");

/**
 * To keep our route closure nice and clean, we'll define all our interactions
 * with the Copper controller here.
 */
const actions = {
  listActivityTypes: async (payload) => {
    const activities = await listActivityTypes();

    return activities;
  },
  updateLeadStatus: async (payload) => {
    const { leadId, statusId } = payload;

    const lead = await updateLeadStatus(leadId, statusId);

    return lead;
  },
};

/**
 * POST /api/copper
 *
 * This route is used to interact with the Copper API.
 */
router.post("/copper/receive", async (request, response) => {
  const { action, payload } = request.body;

  const result = await actions[action](payload);

  response.json(result);
});

module.exports = router;
