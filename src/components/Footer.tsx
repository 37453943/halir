export default function Footer() {
    return (
        // Changed background color for a slightly warmer, off-white look
        <footer className="bg-[#f6f8f6] text-black mt-10 border-t-2 border-b-2 border-gray-200">
            {/* Main content container with all-side border */}
            <div className="max-w-7xl mx-auto p-0 ">
                {/* Added border-gray-300 */}
                <div className="px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">

                    {/* Column 1: Client Care */}
                    <div>
                        <h3 className="font-heading text-lg font-bold tracking-widest uppercase mb-4 pb-1 border-b border-gray-300 inline-block">
                            Client Care
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    Orders
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    Shipping & Handling
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    Return & Refund
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 2: Company */}
                    <div>
                        <h3 className="font-heading text-lg font-bold tracking-widest uppercase mb-4 pb-1 border-b border-gray-300 inline-block">
                            Company
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    Terms & Conditions
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    FAQ
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Follow Us */}
                    <div>
                        <h3 className="font-heading text-lg font-bold tracking-widest uppercase mb-4 pb-1 border-b border-gray-300 inline-block">
                            Follow Us
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    Facebook
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    Instagram
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-700 transition">
                                    TikTok
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Newsletter */}
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="font-heading text-lg font-bold tracking-widest uppercase mb-4 pb-1 border-b border-gray-300 inline-block">
                            Join Newsletter
                        </h3>
                        <p className="text-sm mb-4 text-gray-700">
                            Subscribe to get updates about our latest collections and offers.
                        </p>
                        <form className="flex flex-col gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="p-3 border border-gray-200 bg-white placeholder-gray-500 focus:ring-0 focus:border-black outline-none transition"
                            />
                            {/* Newsletter button: only text and bottom border */}
                            <button
                                className="text-black p-0 m-1 uppercase font-bold text-sm tracking-wider 
                                           border-b border-black inline-block text-left self-start hover:text-gray-700 
                                           hover:border-gray-700 transition duration-200 focus:outline-none"
                                type="submit" // Good practice for forms
                            >
                                Sign Up
                            </button>
                        </form>
                    </div>
                </div>

                {/* Copyright Row - now also inside the main bordered container */}
                <div className="border-t border-gray-300 text-sm py-4 px-4">
                    <div className="flex justify-between items-center text-gray-700">
                        <span>© {new Date().getFullYear()} HALIR Perfumery</span>
                        <span className="text-xs">All rights reserved.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}