import React from 'react';

const teamMembers = [
    { initials: 'AT', name: 'Alex Turner', role: 'CEO & Founder', color: '#6c63ff' },
    { initials: 'SL', name: 'Sara Liu', role: 'CTO', color: '#ff6b9d' },
    { initials: 'MK', name: 'Marcus King', role: 'Lead Designer', color: '#22c55e' },
    { initials: 'JP', name: 'Julia Park', role: 'Product Manager', color: '#f59e0b' },
];

const values = [
    { icon: '💡', title: 'Innovation', desc: 'We push boundaries and embrace modern technologies to build the future.' },
    { icon: '🤝', title: 'Integrity', desc: 'Transparency and honesty drive every decision we make.' },
    { icon: '🌍', title: 'Impact', desc: 'Our products are designed to make a real difference in people\'s lives.' },
    { icon: '⚡', title: 'Excellence', desc: 'We hold ourselves to the highest standards in everything we deliver.' },
];

const About = () => (
    <div className="page">
        <div className="page-header">
            <div className="container">
                <span className="badge badge-primary" style={{ marginBottom: 16 }}>ABOUT US</span>
                <h1>Building the Future,<br /><span className="gradient-text">One Pixel at a Time</span></h1>
                <p>We are a passionate team creating modern digital experiences that connect people and drive results.</p>
            </div>
        </div>

        {/* Mission */}
        <section className="section">
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
                    <div>
                        <span className="badge badge-primary" style={{ marginBottom: 16 }}>OUR MISSION</span>
                        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', marginBottom: 20 }}>Empowering Businesses with Modern Technology</h2>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: 16 }}>
                            Founded with a vision to simplify digital experiences, we build tools that help businesses scale and users thrive. Our full-stack platform combines the best of React, Node.js, and Supabase to deliver seamless, real-time applications.
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                            Every line of code we write is crafted with care, ensuring your application is fast, secure, and ready for the future.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {[['500+', 'Happy Users'], ['99.9%', 'Uptime'], ['24/7', 'Support'], ['50+', 'Features']].map(([val, label]) => (
                            <div key={label} className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: 6 }} className="gradient-text">{val}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Values */}
        <section className="section section-alt">
            <div className="container">
                <h2 className="section-title" style={{ marginBottom: 12 }}>Our <span className="gradient-text">Core Values</span></h2>
                <p className="lead" style={{ marginBottom: 52 }}>The principles that guide everything we do.</p>
                <div className="features-grid">
                    {values.map(v => (
                        <div key={v.title} className="card">
                            <div className="feature-icon" style={{ background: 'var(--color-surface2)' }}>{v.icon}</div>
                            <h3 style={{ marginBottom: 8 }}>{v.title}</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>{v.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Team */}
        <section className="section">
            <div className="container">
                <h2 className="section-title" style={{ marginBottom: 12 }}>Meet the <span className="gradient-text">Team</span></h2>
                <p className="lead" style={{ marginBottom: 52 }}>The talented people behind our platform.</p>
                <div className="team-grid">
                    {teamMembers.map(m => (
                        <div key={m.name} className="card team-card">
                            <div className="team-avatar" style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}88)` }}>{m.initials}</div>
                            <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>{m.name}</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{m.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);

export default About;
