import axios from "axios";
require("regenerator-runtime/runtime");

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
  await axios.post(`http://localhost:8580/logReader/${path}`, postRequest)


const tidyEntry = (entry) => ({
  ...entry,
  date: new Date(before(entry.date, ",")).toISOString().substring(0, 19).replace('T', ' '),
  severity: entry.severity,
  message: '[' + entry.source + '] ' + entry.body.message,
  object: entry.body.object
})


const directoriesIn = (filepath) => filepath.replace(/\\/g, "/").split("/");


export const entriesBetween = async (startIndex, stopIndex, filepath) =>
  (await resultFromServer("read", {
    startIndex,
    stopIndex,
    components: directoriesIn(filepath)
  }))
    .data.data.entries
    .map(tidyEntry)


export const countEntries = async (filepath) =>
  (await resultFromServer("entriesCount", {
    components: directoriesIn(filepath)
  }))
    .data.data.entriesCount


export default async function getData(filepath) {
  return entriesBetween(0, await countEntries(filepath), filepath)
}
