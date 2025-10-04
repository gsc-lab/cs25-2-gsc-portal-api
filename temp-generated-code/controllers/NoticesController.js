/**
 * The NoticesController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/NoticesService');
const noticesGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.noticesGET);
};

const noticesNoticeIdDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.noticesNoticeIdDELETE);
};

const noticesNoticeIdDispatchPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.noticesNoticeIdDispatchPOST);
};

const noticesNoticeIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.noticesNoticeIdGET);
};

const noticesNoticeIdPATCH = async (request, response) => {
  await Controller.handleRequest(request, response, service.noticesNoticeIdPATCH);
};

const noticesNoticeIdReadPATCH = async (request, response) => {
  await Controller.handleRequest(request, response, service.noticesNoticeIdReadPATCH);
};

const noticesNoticeIdStatusGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.noticesNoticeIdStatusGET);
};

const noticesPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.noticesPOST);
};


module.exports = {
  noticesGET,
  noticesNoticeIdDELETE,
  noticesNoticeIdDispatchPOST,
  noticesNoticeIdGET,
  noticesNoticeIdPATCH,
  noticesNoticeIdReadPATCH,
  noticesNoticeIdStatusGET,
  noticesPOST,
};
