import React from 'react';
import '../styles/Home.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaPlane, FaHotel, FaUmbrellaBeach, FaConciergeBell } from 'react-icons/fa';

const destinations = [
    {
        image: 'Images/danang.jpg',
        title: 'Da Nang City',
        description: 'Discover the stunning beauty of Da Nang with its pristine My Khe Beach, iconic Dragon Bridge, and magical Ba Na Hills',
    },
    {
        image: 'Images/hanoi.jpg',
        title: 'Ha Noi capital',
        description: 'Explore the thousand-year-old capital, a vibrant city renowned for Hoan Kiem Lake, its charming Old Quarter, and exquisite cuisine that will tantalize your taste buds.',
    },
    {
        image: 'Images/phuquoc.jpg',
        title: 'Phu Quoc Island',
        description: "Vietnam's gem island, featuring pristine beaches and fresh seafood.",
    },
    {
        image: 'Images/tphcm.jpg',
        title: 'Ho Chi Minh City',
        description: 'Experience the vibrant pulse of the city, known for Ben Thanh Market and an exciting nightlife.',
    },
];

const services = [
    {
        icon: <FaPlane className="text-4xl text-blue-500" />,
        title: 'Flight Booking',
        description: 'Flight ticket booking is simple in a few steps.',
    },
    {
        icon: <FaHotel className="text-4xl text-blue-500" />,
        title: 'Hotel Booking',
        description: 'Wonderful hotel rooms at discounted prices.',
    },
    {
        icon: <FaUmbrellaBeach className="text-4xl text-blue-500" />,
        title: 'Beach Tours',
        description: 'Explore beautiful beaches.',
    },
    {
        icon: <FaConciergeBell className="text-4xl text-blue-500" />,
        title: 'Concierge Services',
        description: 'Offering you customized services.',
    },

];

const PopularDestination = () => {
    return (
        <div className="popular-destination">
            <h2 className="tt">Popular Destinations</h2>
                <div className="container">
                    <div className="grid-container">
                        {destinations.map((city, index) => (
                            <div key={index} className="card">
                                <img src={city.image} alt={city.title} className="card-image" />
                                <div className="card-content">
                                    <h3 className="card-title">{city.title}</h3>
                                    <p className="card-description">{city.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
        </div>
    );
};

const Services = () => {
    return (
        <div className="services-container">
            <div className="container">
                <h2 className="tt">Our Services</h2>
                <div className="services-grid">
                    {services.map((service, index) => (
                        <div key={index} className="service-card">
                            <div className="icon-container">{service.icon}</div>
                            <h3 className="service-title">{service.title}</h3>
                            <p className="service-description">{service.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Home = () => {
    return (
        <>
            <Navbar />
            <div className="home-container">
                <div className="overlay">
                    <h1 className="title">Explore the World with Us</h1>
                    <p className="subtitle">Discover amazing places at exclusive deals</p>
                    <button className="cta-button">Get Started</button>
                </div>
            </div>
            <PopularDestination />
            <Services />
            <Footer />
        </>
    );
};

export default Home;