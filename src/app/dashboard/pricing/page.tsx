import { PricingTable } from '@clerk/nextjs'
import React from 'react'

function PricingPage() {
    return (
        <div className="p-8 space-y-4">
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
    )
}

export default PricingPage
