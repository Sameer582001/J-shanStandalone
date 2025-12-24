import React, { useState } from 'react';
import { Menu, X, ArrowRight, TrendingUp, Users, Gift, ShieldCheck, Mail, MapPin, Phone, Globe, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AwardsCarousel } from '../components/landing/AwardsCarousel';
import { LegalDocuments } from '../components/landing/LegalDocuments';

const LandingPage: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 cursor-pointer" onClick={() => scrollToSection('home')}>
                                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 tracking-tight">
                                    JSE System
                                </h1>
                            </div>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-8">
                            <button onClick={() => scrollToSection('home')} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Home</button>
                            <button onClick={() => scrollToSection('about')} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">About Us</button>
                            <button onClick={() => scrollToSection('products')} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Products</button>
                            <button onClick={() => scrollToSection('plan')} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Plan</button>
                            <button onClick={() => scrollToSection('contact')} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Support</button>
                            <Link
                                to="/login"
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                Member Login
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-card border-t border-border animate-in slide-in-from-top-2">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <button onClick={() => scrollToSection('home')} className="block w-full text-left px-3 py-3 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md">Home</button>
                            <button onClick={() => scrollToSection('about')} className="block w-full text-left px-3 py-3 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md">About Us</button>
                            <button onClick={() => scrollToSection('products')} className="block w-full text-left px-3 py-3 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md">Products</button>
                            <button onClick={() => scrollToSection('plan')} className="block w-full text-left px-3 py-3 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md">Plan</button>
                            <button onClick={() => scrollToSection('contact')} className="block w-full text-left px-3 py-3 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md">Contact</button>
                            <Link
                                to="/login"
                                className="block w-full text-center px-3 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-bold mt-4"
                            >
                                Member Login
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight">
                                J-SHAN
                                <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">ENTERPRISES</span>
                            </h1>

                            <p className="text-xl text-muted-foreground/80 max-w-lg">Powering Growth. Enabling Enterprise through innovative financial solutions.</p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1"
                                >
                                    Get Started
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                                <button
                                    onClick={() => scrollToSection('plan')}
                                    className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-primary/20 text-foreground rounded-xl hover:bg-primary/5 transition-colors text-lg font-semibold"
                                >
                                    View Plan
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-purple-500 rounded-full blur-3xl opacity-10"></div>
                            <div className="relative bg-card/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center p-4 rounded-xl hover:bg-white/5 transition-colors">
                                        <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                                            <TrendingUp className="w-8 h-8 text-white" />
                                        </div>
                                        <p className="text-foreground font-bold text-2xl">₹12.28Cr+</p>
                                        <p className="text-muted-foreground text-sm">Earning Potential</p>
                                    </div>
                                    <div className="text-center p-4 rounded-xl hover:bg-white/5 transition-colors">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                                            <Users className="w-8 h-8 text-white" />
                                        </div>
                                        <p className="text-foreground font-bold text-2xl">3x4 Matrix</p>
                                        <p className="text-muted-foreground text-sm">Dual Pool System</p>
                                    </div>
                                    <div className="text-center p-4 rounded-xl hover:bg-white/5 transition-colors">
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                                            <Gift className="w-8 h-8 text-white" />
                                        </div>
                                        <p className="text-foreground font-bold text-2xl">Pigeon Brand</p>
                                        <p className="text-muted-foreground text-sm">Premium Products</p>
                                    </div>
                                    <div className="text-center p-4 rounded-xl hover:bg-white/5 transition-colors">
                                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                                            <ShieldCheck className="w-8 h-8 text-white" />
                                        </div>
                                        <p className="text-foreground font-bold text-2xl">₹1,750</p>
                                        <p className="text-muted-foreground text-sm">Joining Package</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">About J-SHAN ENTERPRISES</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 mx-auto mb-6 rounded-full"></div>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Revolutionizing the multi-level marketing industry with innovative plans and customer-centric services
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {[
                            { title: 'Our Vision', desc: 'To provide innovative insurance solutions and a rewarding financial security opportunity.', number: '01' },
                            { title: 'Our Mission', desc: 'To empower individuals to achieve financial security, peace of mind, and lifelong happiness.', number: '02' },
                            { title: 'Our Goal', desc: 'To lead the global opportunity while helping people secure their future without boundaries.', number: '03' }
                        ].map((item, i) => (
                            <div key={i} className="glass-card p-8 rounded-2xl border border-white/5 hover:border-primary/30 group">
                                <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6 text-foreground text-2xl font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    {item.number}
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-4">{item.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-12 text-center backdrop-blur-sm">
                        <h3 className="text-3xl font-bold text-foreground mb-4">Our Commitment</h3>
                        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                            With complete transparency in operations, we are extremely confident that our plans will help people fulfill their dreams and achieve their goal of lifelong financial security.
                        </p>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section id="products" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Premium Pigeon Products</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 mx-auto mb-6 rounded-full"></div>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Quality home appliances worth ₹1,750 and above included in your joining package
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'Pressure Cooker', img: 'https://d2ki7eiqd260sq.cloudfront.net/Nonstick-Cookware13ecb7a8-5b79-4a41-b675-ef6847846e79.webp' },
                            { title: 'Gas Stoves', img: 'https://5.imimg.com/data5/SELLER/Default/2023/5/308272488/OS/JI/DU/189364655/pigeon-indian-stainless-steel-4-burner-gas-stove-black.jpg' },
                            { title: 'Induction Cookers', img: 'https://www.myg.in/images/thumbnails/300/300/detailed/41/pi4.jpg.png' },
                            { title: 'Kitchen Appliances', img: 'https://backend.paiinternational.in/media/images/Kitchen-Combo.jpg' }
                        ].map((prod, i) => (
                            <div key={i} className="bg-card rounded-xl overflow-hidden border border-border group hover:border-primary/50 transition-all hover:-translate-y-1 shadow-lg">
                                <div className="h-48 bg-muted overflow-hidden">
                                    <img
                                        src={prod.img}
                                        alt={prod.title}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-foreground mb-1">{prod.title}</h3>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Pigeon Brand</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Fast Track Rewards */}
                    <div className="mt-20 bg-card border border-border rounded-2xl p-8 lg:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -z-10"></div>

                        <h3 className="text-2xl font-bold text-foreground mb-8 text-center flex items-center justify-center gap-2">
                            <Gift className="text-primary w-6 h-6" /> Fast Achievement Rewards
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { target: '3 Direct', reward: '₹5,000 Products' },
                                { target: '5 Direct', reward: '₹6,000 Products' },
                                { target: '10 Direct', reward: '₹8,000 Products' },
                                { target: '20 Direct', reward: '₹10,000 Products' }
                            ].map((item, i) => (
                                <div key={i} className="text-center p-6 bg-muted/30 rounded-xl border border-white/5">
                                    <div className="text-3xl font-bold text-primary mb-2">{item.target}</div>
                                    <p className="text-foreground font-medium">{item.reward}</p>
                                    <p className="text-xs text-muted-foreground mt-2">Within 10 days</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Awards Carousel Section */}
            <AwardsCarousel />

            {/* Legal Documents Section */}
            <LegalDocuments />

            {/* Plan Section */}
            <section id="plan" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Income Plan</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 mx-auto mb-6 rounded-full"></div>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Dual pool system with 3x4 matrix structure
                        </p>
                    </div>

                    {/* Joining Package Breakdown */}
                    <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-8 mb-12">
                        <h3 className="text-2xl font-bold text-foreground text-center mb-8">Joining Package Breakdown - ₹1,750</h3>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                            {[
                                { label: 'Product Value', val: '₹1,750' },
                                { label: 'GST', val: '₹300' },
                                { label: 'Auto Pool ID', val: '₹500' },
                                { label: 'Self Pool ID', val: '₹500' },
                                { label: 'Direct Comm.', val: '₹250' },
                                { label: 'Courier', val: '₹200' },
                            ].map((stat, i) => (
                                <div key={i} className="p-3 bg-background/50 rounded-lg backdrop-blur-sm border border-white/5">
                                    <p className="text-muted-foreground text-xs mb-1">{stat.label}</p>
                                    <p className="text-foreground font-bold text-lg">{stat.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Plan Details Table */}
                    <div className="glass-panel overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Level</th>
                                        <th className="px-6 py-4 text-left">Members</th>
                                        <th className="px-6 py-4 text-left">Pool Amount</th>
                                        <th className="px-6 py-4 text-left">Commission</th>
                                        <th className="px-6 py-4 text-left">Upline Gift</th>
                                        <th className="px-6 py-4 text-left">Rebirth IDs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[
                                        { lvl: 1, mem: '3x', pool: '₹500', comm: '₹300', gift: '₹200', id: '--' },
                                        { lvl: 2, mem: '9x', pool: '₹1,000', comm: '₹1,000', gift: '₹2,000', id: '2 IDs', highlight: true },
                                        { lvl: 3, mem: '27x', pool: '₹3,000', comm: '₹45,000', gift: '₹6,000', id: '6 IDs', highlight: true },
                                        { lvl: 4, mem: '81x', pool: '₹27,000', comm: '₹19,03,700', gift: '₹54,000', id: '54 IDs', highlight: true },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-bold text-foreground">{row.lvl}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{row.mem}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{row.pool}</td>
                                            <td className="px-6 py-4 text-green-400 font-bold">{row.comm}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{row.gift}</td>
                                            <td className={`px-6 py-4 font-bold ${row.highlight ? 'text-primary' : 'text-muted-foreground'}`}>{row.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Support</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 mx-auto mb-6 rounded-full"></div>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            We are here to help you grow
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="bg-card p-8 rounded-2xl border border-border flex items-start gap-4 hover:border-primary/50 transition-colors">
                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Email Us</h3>
                                <p className="text-muted-foreground text-sm mt-1">jshanenterprises@gmail.com</p>
                            </div>
                        </div>

                        <div className="bg-card p-8 rounded-2xl border border-border flex items-start gap-4 hover:border-primary/50 transition-colors">
                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Call Us</h3>
                                <p className="text-muted-foreground text-sm mt-1">+91 8277287555</p>
                            </div>
                        </div>
                        <div className="bg-card p-8 rounded-2xl border border-border flex items-start gap-4 hover:border-primary/50 transition-colors">
                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Visit Us</h3>
                                <p className="text-muted-foreground text-sm mt-1">Belgaum, Karnataka, India</p>
                            </div>
                        </div>
                        <div className="bg-card p-8 rounded-2xl border border-border flex items-start gap-4 hover:border-primary/50 transition-colors">
                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Website</h3>
                                <p className="text-muted-foreground text-sm mt-1">www.jshan.in</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-8 border-t border-white/10 text-center text-muted-foreground text-sm">
                <p>© 2025 J-SHAN Enterprises. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
