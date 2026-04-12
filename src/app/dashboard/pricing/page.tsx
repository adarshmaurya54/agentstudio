import { PricingTable } from '@clerk/nextjs'
import React from 'react'

function PricingPage() {
    return (
        <div className='space-y-5 py-10' style={{ maxWidth: '800px', margin: '0 auto'}}>
            <h2 className='text-center block font-bold text-2xl'>Pricing</h2>
            <PricingTable />
        </div>
    )
}

export default PricingPage
