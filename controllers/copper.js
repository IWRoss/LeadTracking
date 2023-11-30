// Axios
const axios = require("axios");

const activityTypes = [
  {
    id: 0,
    category: "user",
    name: "Note",
  },
  {
    id: 54578,
    category: "user",
    name: "Meeting",
  },
  {
    id: 6,
    category: "system",
    name: "Email",
  },
  {
    id: 1977146,
    category: "user",
    name: "Status Updated",
  },
];

/**
 * Make a request to the Copper API
 *
 * @param {*} method
 * @param {*} endpoint
 * @param {*} data
 * @returns
 */
const makeCopperRequest = async (method, endpoint, data) => {
  const url = `https://api.copper.com/developer_api/v1/${endpoint}`;
  const token = process.env.COPPER_API_TOKEN;

  const config = {
    method: method,
    url: url,
    headers: {
      "X-PW-AccessToken": token,
      "X-PW-Application": "developer_api",
      "X-PW-UserEmail": process.env.COPPER_API_USER_EMAIL,
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

/**
 * List Leads (Search)
 *
 * POST https://api.copper.com/developer_api/v1/leads/search
 */
const listLeads = async (data) => {
  const endpoint = "leads/search";

  return await makeCopperRequest("post", endpoint, data);
};

/**
 * List Activity Types
 *
 * GET https://api.copper.com/developer_api/v1/activity_types
 */
const listActivityTypes = async () => {
  const endpoint = "activity_types";

  return await makeCopperRequest("get", endpoint);
};

/**
 * See a Lead's Activities
 *
 * POST https://api.copper.com/developer_api/v1/leads/{{example_lead_id}}/activities
 */
const listLeadActivities = async (leadId) => {
  const endpoint = `leads/${leadId}/activities`;

  const body = {
    activity_types: activityTypes,
  };

  return await makeCopperRequest("post", endpoint, body);
};

/**
 * List recently interacted leads
 */
const listRecentlyInteractedLeads = async () => {
  const unixTimestamp60DaysAgo =
    Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60;

  const leads = await listLeads({
    page_number: 1,
    page_size: 100,
    sort_by: "inactive_days",
    sort_direction: "asc",
    minimum_interaction_date: unixTimestamp60DaysAgo,
    include_converted_leads: true,
    custom_fields: [
      {
        custom_field_definition_id:
          process.env.COPPER_LEAD_TRACKING_CUSTOM_FIELD_ID,
        value: true,
      },
    ],
  });

  return leads;
};

/**
 *
 */
const listPrettyRecentlyInteractedLeads = async () => {
  const leads = await listRecentlyInteractedLeads();

  return leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    company: lead.company_name,
    title: lead.title,
    status: lead.status,
    email: lead.email?.email,
    copperDateCreated: {
      unixTimestamp: lead.date_created,
      niceDate: new Date(lead.date_created * 1000).toDateString(),
    },
    copperDateModified: {
      unixTimestamp: lead.date_modified,
      niceDate: new Date(lead.date_modified * 1000).toDateString(),
    },
    copperDateLastContacted: {
      unixTimestamp: lead.date_last_contacted,
      niceDate: new Date(lead.date_last_contacted * 1000).toDateString(),
    },
    interactionCount: lead.interaction_count,
    converted_at: lead.converted_at
      ? {
          unixTimestamp: lead.converted_at,
          niceDate: new Date(lead.converted_at * 1000).toDateString(),
        }
      : null,
    funnel:
      lead.custom_fields.find(
        (customField) =>
          customField.custom_field_definition_id ===
          Number(process.env.COPPER_MARKETING_SOURCE_CUSTOM_FIELD_ID)
      )?.value || "N/A",
  }));
};

/**
 * List recently interacted leads with activities
 */
const listRecentlyInteractedLeadsWithActivities = async () => {
  const leads = await listRecentlyInteractedLeads();

  const leadsWithActivities = await Promise.all(
    leads.map(async (lead) => {
      const activities = await listLeadActivities(lead.id);

      return {
        ...lead,
        activities: activities.map((activity) => ({
          id: activity.id,
          type: activityTypes.find(
            (activityType) => activityType.id === activity.type.id
          ).name,
          date: {
            unixTimestamp: activity.activity_date,
            niceDate: new Date(activity.activity_date * 1000).toDateString(),
          },
          details: activity.details,
        })),
      };
    })
  );

  return leadsWithActivities;
};

/**
 *
 */
const listLeadStatuses = async () => {
  const endpoint = "lead_statuses";

  return await makeCopperRequest("get", endpoint);
};

/**
 *
 */
const mapLeadStatus = (statusName, statuses) => {
  return statuses.find((status) => status.name === statusName)?.id;
};

/**
 *
 */
const updateLeadStatus = async (id, status) => {
  const endpoint = `leads/${id}`;

  const leadStatuses = await listLeadStatuses();

  const leadStatusMapping = {
    0: mapLeadStatus("4. New Lead", leadStatuses),
    1: mapLeadStatus("4. New Lead", leadStatuses),
    2: mapLeadStatus("3. Warm - Marketing Qualified Lead", leadStatuses),
    3: mapLeadStatus("3. Warm - Marketing Qualified Lead", leadStatuses),
    4: mapLeadStatus("2. Hot - Sales Ready Lead", leadStatuses),
    5: mapLeadStatus("2. Hot - Sales Ready Lead", leadStatuses),
    6: mapLeadStatus("1. Piping Hot - Sales Qualified Lead", leadStatuses),
  };

  const convertedStatus = leadStatusMapping[status] || false;

  if (convertedStatus === false) {
    return;
  }

  const body = {
    status_id: convertedStatus,
  };

  return await makeCopperRequest("put", endpoint, body);
};

module.exports = {
  makeCopperRequest,
  listLeads,
  listActivityTypes,
  listRecentlyInteractedLeads,
  listPrettyRecentlyInteractedLeads,
  listRecentlyInteractedLeadsWithActivities,
  updateLeadStatus,
};
