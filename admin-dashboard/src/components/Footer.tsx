const Footer = () => {
    return (
        <footer className="w-full py-6 px-6 bg-white border-t border-gray-100 mt-auto">
            <div className="max-w-7xl mx-auto flex justify-end pr-8 sm:pr-12">
                <div className="flex flex-col items-end">
                    <p className="text-sm text-gray-500 font-medium">
                        Powered by: <span className="text-brand-600 font-bold ml-1 tracking-wide">MaSha Secure Tech</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-semibold">
                        © {new Date().getFullYear()} MaSha Secure Tech. All Rights Reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
