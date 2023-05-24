/**
 * BubbleDataClient class for communicating with Bubble's Data API.
 *
 * @example
 * const client = new BubbleDataClient('https://yourapp.bubbleapps.io/api/1.1', 'your_api_key');
 * const constraintsBuilder = new ConstraintsBuilder();
 * constraintsBuilder.addConstraint("unitname", "equals", "Unit A");
 * constraintsBuilder.addConstraint("unitnumber", "greater than", 3);
 * const constraints = constraintsBuilder.build();
 * const data = await client.getDataList('rentalunit', constraints);
 *
 * @module BubbleDataClient
 */
module.exports = class BubbleDataClient {

    /**
     * Constructs a new BubbleDataClient instance.
     *
     * @param {string} baseURL - The base URL for the Bubble API.
     * @param {string} apiKey - Your Bubble API key.
     */
    constructor(baseURL, apiKey) {
      this.baseURL = baseURL;
      this.apiKey = apiKey;
    }
  
    /**
     * Retrieves a list of things from the Bubble API with optional constraints, pagination, and fetchAll flag.
     *
     * @param {string} type - The type of thing to retrieve.
     * @param {Array} [constraints=[]] - An array of constraint objects to filter the results.
     * @param {number} [limit=100] - The maximum number of results to return per request.
     * @param {number} [cursor=0] - The starting index for the results.
     * @param {boolean} [fetchAll=false] - Whether to fetch all results across multiple pages.
     * @returns {Promise<Object>} A promise that resolves to the response object containing the results.
     */
    async getThings(type, constraints = [], limit = 100, cursor = 0, fetchAll = false) {
      const constraintParam = encodeURIComponent(JSON.stringify(constraints));
      
      const endpoint = `obj/${type}?limit=${limit}&cursor=${cursor}&constraints=${constraintParam}`;
      const url = this.baseURL + "/" + endpoint;
      console.log(url);
      const response = await request(url, this.apiKey, 'GET');
      
      if (fetchAll && response.remaining > 0) {
        const nextCursor = cursor + limit;
        const remainingData = await this.getThings(type, constraints, limit, nextCursor, fetchAll);
        response.results = response.results.concat(remainingData.results);
        response.remaining = remainingData.remaining;
      }
      
      return response;
    }
  
    /**
     * Creates a new thing in the Bubble API.
     *
     * @param {string} type - The type of thing to create.
     * @param {Object} data - The data object containing the properties and values for the new thing.
     * @returns {Promise<Object>} A promise that resolves to the response object containing the created thing.
     */
    async createThing(type, data) {
      const endpoint = `obj/${type}`;
      const url = this.baseURL + "/" + endpoint;
      const response = await request(url, this.apiKey, 'POST', 'application/json', data);
      return response;
    }
  
    async createBulkThings(type, things) {
      const endpoint = `obj/${type}/bulk`;
      const url = this.baseURL + "/" + endpoint;
      const requestBody = things.map(thing => JSON.stringify(thing)).join('\n');
      const response = await request(url, this.apiKey, 'POST', "text/plain", requestBody);
      // parse plain text response into JSON
      const results = response.split('\n').map(line => JSON.parse(line));
      return results;
    }
  
    async updateThing(type, id, data) {
      const endpoint = `obj/${type}/${id}`;
      const url = this.baseURL + "/" + endpoint;
      const response = await request(url, this.apiKey, 'PUT', 'application/json', data);
      return response;
    }
  
  }
  
  // Helper function for making requests to the Bubble API
  async function request(url, apiKey, method, content_type = 'application/json', data = null) {
  
    const headers = new Headers({
      'Content-Type': content_type,
      'Authorization': `Bearer ${apiKey}`,
    });
  
    var options = {
      method,
      headers,
    };
  
    if (data) {
      if (content_type === 'application/json') {
        options.body = JSON.stringify(data);
      } else if (content_type === 'text/plain') {
        options.body = data;
      } else {
        throw new Error(`Unsupported content type: ${content_type}`);
      }
    }
  
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}, ${response.statusText}, ${response.url}`);
    }
    if (content_type === 'application/json') {
      if (response.status === 204) {
        return {};
      }
      return response.json();
    } else if (content_type === 'text/plain') {
      return response.text();
    }
  }