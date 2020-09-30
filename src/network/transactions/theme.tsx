import { createMuiTheme } from '@material-ui/core';

export const theme = createMuiTheme({

    overrides: {
        MuiTableCell: {
            stickyHeader: {
                backgroundColor: 'var(--vscode-sideBarSectionHeader-background)',
                color: 'var(--vscode-editor-foreground)'
            },
            body: {
                color: 'var(--vscode-editor-foreground)'
            }
        },
        MuiButton: {
            outlinedPrimary: {
                backgroundColor: 'var(--vscode-button-hoverBackground)',
                color: '#FFFFFF',
                border: '0px',
                '&:hover': {
                    backgroundColor: 'var(--vscode-list-highlightForeground)',
                    border: '0px',
                    color: '#FFFFFF'
                },
            },
            containedPrimary: {
                backgroundColor: 'var(--vscode-button-hoverBackground)',
                color: '#FFFFFF',
                '&:hover': {
                    backgroundColor: 'var(--vscode-list-highlightForeground)',
                    color: '#FFFFFF'
                },
            },
            containedSecondary: {
                backgroundColor: 'var(--vscode-list-highlightForeground)',
                color: 'var(--vscode-sideBarSectionHeader-foreground)'
            }
        }
    }
});