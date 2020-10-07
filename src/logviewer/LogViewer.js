import React from 'react'

import CssBaseline from '@material-ui/core/CssBaseline'
import EnhancedTable from './components/EnhancedTable'
import getData from './getData'

const LogViewer = (props) => {
  
  const columns = React.useMemo(
    () => [
      {
        Header: 'Severity',
        accessor: 'severity',
        width: 100,
      },
      {
        Header: 'Date / Time',
        accessor: 'date',
        width: 160,
      },
      {
        Header: 'Message',
        accessor: 'message',
      },
      {
        Header: "Attached Object",
        accessor: 'object',
      }
    ],
    []
  )

  const [data, setData] = React.useState([]);
  const [skipPageReset, setSkipPageReset] = React.useState(false)
  React.useEffect(() => {
    (async function fetchData() {
      console.log(props.filepath);
      setData(await getData(props.filepath));
    })()
  }, [])

  const updateLogData = (rowIndex, columnId, value) => {
    setSkipPageReset(true)
    setData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
          }
        }
        return row
      })
    )
  }

  return (
    <div>
      <CssBaseline />
      <EnhancedTable
        columns={columns}
        data={data}
        setData={setData}
        updateMyData={updateLogData}
        skipPageReset={skipPageReset}
      />
    </div>
  )
}


export default LogViewer
