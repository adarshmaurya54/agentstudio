import { PricingTable } from '@clerk/nextjs'
import React from 'react'

function PricingPage() {
    return (
        <div className='bg-sidebar px-3 md:pb-0 pb-3 h-[90%]'>
            <div className="px-3 h-full space-y-4 bg-white rounded-4xl p-6 border">
                <h2 className='text-center block font-bold text-2xl'>Pricing</h2>
                <div className="pricing-wrapper">
                    <PricingTable
                        appearance={{
                            variables: {
                                borderRadius: "10px",
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

export default PricingPage
