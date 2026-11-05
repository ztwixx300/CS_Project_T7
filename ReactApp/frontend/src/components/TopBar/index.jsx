import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useLocation } from 'react-router-dom'

const pages = [
    { label: 'Home', path: '/' },
    { label: 'FAQ', path: '/faq' },
]

function TopBar() {
    const { pathname } = useLocation()

    return (
        <AppBar className="topbar-appbar" position="static" sx={{ backgroundColor: '#0b1a20' }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h5" component={Link} to="/" sx={{ color: 'inherit', fontWeight: 1500, textDecoration: 'none' }}>
                    AirAware
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {pages.map((page) => {
                        const active = pathname === page.path
                        return (
                            <Button key={page.path}
                                component={Link}
                                to={page.path}
                                color="inherit"
                                sx={{
                                    fontWeight: active ? 700 : 400,
                                    borderRadius: 0,
                                    borderBottom: active ? '2px solid #4fd1c5' : '2px solid transparent'
                                }}>
                                {page.label}
                            </Button>
                        )
                    })}
                </Box>
            </Toolbar>
        </AppBar>
    )
}

export default TopBar;