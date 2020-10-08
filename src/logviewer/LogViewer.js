import React from 'react'

import CssBaseline from '@material-ui/core/CssBaseline'
import EnhancedTable from './components/EnhancedTable'
import getData from './getData'

const LogViewer = ({filepath}) => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Thread',
        accessor: 'thread',
        width: 100,
      },
      {
        Header: 'Severity',
        accessor: 'severity',
        width: 100,
        canGroupBy: false,
      },
      {
        Header: 'Date / Time',
        accessor: 'date',
        width: 160,
        canGroupBy: false,
      },
      {
        Header: 'Message',
        accessor: 'message',
        canGroupBy: false,
      },
      // {
      //   Header: 'Attached Object',
      //   accessor: 'object',
      //   canGroupBy: false,
      // }
    ],
    []
  )

  const [data, setData] = React.useState([]);
  const [skipPageReset, setSkipPageReset] = React.useState(false)
  React.useEffect(() => {
    (async function fetchData() {
      console.log(filepath);
      setData(await getData(filepath));
    })()
  }, [filepath])

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
