"use client";
import React, { useState, useEffect } from 'react';
import Link from "next/link";

// Define the shape of the state object for TypeScript
interface TimeLeft {
    d?: string;
    h?: string;
    m?: string;
    s?: string;
}

const HeroSection: React.FC = () => {
    // State to hold the countdown display strings, typed as TimeLeft
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({});

    // Helper function to pad numbers with a leading zero if needed
    const pad = (num: number): string => (num < 10 ? '0' + num : String(num));

    /**
     * Calculates the time remaining until the next Friday at 11:59:59 PM (sale deadline).
     */
    const calculateTimeLeft = (): TimeLeft => {
        const now = new Date();
        const currentDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
        const targetDay = 5; // Friday (the day the offer ends)

        let daysToAdd: number;

        // Define the target time (23:59:59 PM) for today, if today is the target day.
        const targetTimeToday = new Date(now);
        targetTimeToday.setHours(23, 59, 59, 999);

        // Logic to determine which Friday we are counting down to:

        // 1. If it's Friday and the deadline hasn't passed yet.
        if (currentDay === targetDay && now.getTime() < targetTimeToday.getTime()) {
            daysToAdd = 0; // Count down to the end of today (Friday)
        }
        // 2. If the deadline has passed (Saturday, Sunday, or after 11:59 PM Friday).
        else if (currentDay > targetDay || (currentDay === targetDay && now.getTime() >= targetTimeToday.getTime())) {
            // Calculate days until NEXT Friday: (Days remaining in current week) + (Days to reach target day of 5)
            daysToAdd = (7 - currentDay) + targetDay;
        }
        // 3. It's Monday, Tuesday, Wednesday, or Thursday.
        else {
            // Target this upcoming Friday.
            daysToAdd = targetDay - currentDay;
        }


        // Calculate the absolute date of the target Friday
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + daysToAdd);

        // Set the time to 11:59:59 PM on that target date
        targetDate.setHours(23, 59, 59, 999);

        // Final calculation of milliseconds difference
        const difference = targetDate.getTime() - now.getTime();

        let calculatedTimeLeft: TimeLeft = {};

        if (difference > 0) {
            calculatedTimeLeft = {
                d: pad(Math.floor(difference / (1000 * 60 * 60 * 24))),
                h: pad(Math.floor((difference / (1000 * 60 * 60)) % 24)),
                m: pad(Math.floor((difference / 1000 / 60) % 60)),
                s: pad(Math.floor((difference / 1000) % 60)),
            };
        } else {
            // Timer has reached 0, set to all zeros
            calculatedTimeLeft = { d: '00', h: '00', m: '00', s: '00' };
        }

        return calculatedTimeLeft;
    };

    useEffect(() => {
        // 1. Calculate the time immediately when the component mounts
        setTimeLeft(calculateTimeLeft());

        // 2. Set up the interval to update the timer every second
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        // 3. Clean up the interval when the component unmounts
        return () => clearInterval(timer);
    }, []); // Runs once on mount

    // Format the time string, showing 'Loading...' while the first calculation runs
    const timerDisplay = timeLeft.d !== undefined
        ? `${timeLeft.d}d ${timeLeft.h}h ${timeLeft.m}m ${timeLeft.s}s`
        : 'Loading...';

    return (
        // Uses w-screen to force the section to take up 100% of the viewport width.
        <div
            className="relative w-screen h-screen flex items-end justify-center text-white overflow-hidden"
        >
            {/* Background Image: Absolute position to cover the entire container */}
            <div className="absolute inset-0">
                <img
                    // Corrected image path: public/images/1.png
                    src={'/images/1.png'}
                    alt="Hero background image showcasing perfume bottles"
                    className='w-full h-full object-cover'
                />
            </div>

            {/* Overlay to darken the background image and improve text readability */}
            <div className="absolute inset-0 bg-black opacity-40"></div>

            {/* Content Container: Centered horizontally, aligned to the bottom */}
            <div className="relative z-10 text-center p-8 mb-12 max-w-5xl mx-auto">

                {/* Sale Title */}
                <h2 className="text-xl md:text-2xl mb-4 tracking-wider animate-fade-in-up delay-200">
                    FLAT 40% OFF BIG FRIDAY WEEKEND SALE
                </h2>

                {/* Main Brand/Slogan - Fixed invalid class name (textlg -> text-lg) */}
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-widest mb-4 animate-fade-in-up">
                    HALIR PERFUMERY
                </h1>

                {/* Timer/Offer Text: Dynamic countdown */}
                <p className="text-lg md:text-xl mb-8 animate-fade-in-up delay-400">
                    Offer Ends in: <span className="font-mono text-yellow-400 font-extrabold">{timerDisplay}</span>
                </p>

                {/* CTA Button */}

                {/* CTA Button */}
                <Link href="/products">
                    <button
                        className="bg-white text-black px-4 py-3 text-sm uppercase tracking-widest
               shadow-xl hover:bg-gray-200 transition duration-300 animate-fade-in-up delay-600"
                    >
                        VIEW PRODUCTS
                    </button>
                </Link>

            </div>
        </div>
    );
};

export default HeroSection;