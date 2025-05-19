import logo from './logo_collapsed.png'
export function LogoCollapsed(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <img src={logo} {...props} alt={"Logo"}/>
    )

}
