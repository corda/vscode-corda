import * as React from 'react';
import { LogEntry } from '../backend/types';

export const renderEntry = (entry: LogEntry, key: any) => (
    <div key = {key}>
        {entry.body.message}
    </div>
)