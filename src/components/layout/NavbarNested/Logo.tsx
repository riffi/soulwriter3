import logo from './logo.png'
export function Logo(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <img src={logo} {...props} alt={"Logo"}/>
    )

}
