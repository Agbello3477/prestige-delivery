import logo from '../assets/Logo prestage.jpeg';

const Logo = ({ className = "" }: { className?: string }) => {
    return (
        <div className={`flex items-center ${className}`}>
            <img src={logo} alt="Prestige Logo" className="h-20 w-auto mr-4 mix-blend-multiply" />
            <div className="flex flex-col">
                <span className="text-2xl font-bold text-brand-900 leading-tight">PRESTIGE</span>
                <span className="text-base font-medium text-brand-700">Delivery & Logistics Services</span>
            </div>
        </div>
    );
};

export default Logo;
