import axios from "axios";
require("regenerator-runtime/runtime");

export const SERVER_BASE_URL = window.location.href.startsWith("https") ? "/proxy/8580" : "http://localhost:8580";

// apply token header to axios calls
axios.defaults.headers.common['clienttoken'] = document.getElementById('clienttoken').innerHTML;
axios.defaults.headers.common['rpcconnid'] = document.getElementById('rpcconnid').innerHTML;

export const before = (line, before) => {
  if (line.includes(before) && before !== "") return line.split(before)[0];
  return line;
}


export const after = (line, after) => {
  if (line.includes(after) && after !== "") return line.split(after).slice(1).join(after);
  return line;
}


const resultFromServer = async (path, postRequest) =>
  await axios.post(SERVER_BASE_URL + `/logReader/${path}`, postRequest)


const tidyEntry = (entry) => {
  let dateParse = '';
  try {
    dateParse = new Date(before(entry.date, ",")).toISOString().substring(0, 19).replace('T', ' ');
  } catch (err) {
    console.log(err);
  }
  return ({
    ...entry,
    thread: entry.thread.replace('-client-global-threads', ''),
    date: dateParse,
    severity: entry.severity,
    message: '[' + entry.source + '] ' + entry.body.message,
    object: entry.body.object
  });
}


const directoriesIn = (filepath) => filepath.replace(/\\/g, "/").split("/");


export const entriesBetween = async (startIndex, stopIndex, filepath) =>
  (await resultFromServer("read", {
    startIndex,
    stopIndex,
    components: directoriesIn(filepath)
  }))
    .data.data.entries
    .map(tidyEntry)


export default async function getData(entries, filepath) {
  return entriesBetween(0, entries, filepath)
}
