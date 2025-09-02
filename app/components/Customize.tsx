

'use client'

import React, { useState, useMemo } from 'react'

import Logo from "./Logo"


interface PaperData {
  paperSize: string
  paperType: string
  paperWeight: string
  paperColor: string
  orientation: string
  quantity: number
}

const Customize = () => {
  const [paperData, setPaperData] = useState<PaperData>({
    paperSize: 'A4',
    paperType: 'Standard',
    paperWeight: '80gsm',
    paperColor: 'White',
    orientation: 'Portrait',
    quantity: 1
  })

  const calculatedPrice = useMemo(() => {
    let basePrice = 0.10 

    const sizeMultipliers = {
      '9x5.5cm': 0.8,
      '8x5.5cm': 1.0,
      '8x5cm': 1.8,
      '5.5x5.5cm': 1.8
    }

    const typeMultipliers = {
      'Standard': 1.0,
      'Glossy': 1.5,
      'Matte': 1.3,
      'Recycled': 1.2,
      'Cardstock': 2.0,
      'Photo Paper': 3.0
    }

    const weightMultipliers = {
      '70gsm': 0.9,
      '80gsm': 1.0,
      '90gsm': 1.1,
      '100gsm': 1.2,
      '120gsm': 1.4
    }

    const colorMultipliers = {
      'White': 1.0,
      'Cream': 1.0,
      'Ivory': 1.0,
      'Light Gray': 1.0,
      'Blue': 5.0,
      'Yellow': 1.0
    }

    const pricePerSheet = basePrice + 
      sizeMultipliers[paperData.paperSize] +
      typeMultipliers[paperData.paperType] + 
      weightMultipliers[paperData.paperWeight] + 
      colorMultipliers[paperData.paperColor]


    let quantityDiscount = 1.0
    if (paperData.quantity >= 100) quantityDiscount = 0.9
    else if (paperData.quantity >= 50) quantityDiscount = 0.95

    const totalPrice = pricePerSheet * paperData.quantity * quantityDiscount

    return {
      pricePerSheet: pricePerSheet,
      totalPrice: totalPrice,
      discount: quantityDiscount < 1.0 ? ((1 - quantityDiscount) * 100) : 0
    }
  }, [paperData])

  const handleInputChange = (field: keyof PaperData, value: string | number) => {
    setPaperData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = () => {
    console.log('Paper data:', paperData)
    console.log('Total price:', calculatedPrice.totalPrice)
    alert(`Paper customization saved! Total: ${calculatedPrice.totalPrice.toFixed(2)}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-19 w-full min-h-[100vh]">
      <div className="w-full px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customize Your Paper</h1>
          <p className="text-gray-600 mt-2">Select your paper specifications</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 w-full">
          <div className="flex items-start gap-8">
            <div className="flex-shrink-0">
              <Logo />
            </div>

            <div className="flex-1 max-w-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paper Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paper Size
                  </label>
                  <select
                    value={paperData.paperSize}
                    onChange={(e) => handleInputChange('paperSize', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="9x5.5cm">9x5.5cm</option>
                    <option value="8x5.5cm">8x5.5cm</option>
                    <option value="8x5cm">8x5cm</option>
                    <option value="5.5x5.5cm">5.5x5.5cm</option>
                  </select>
                </div>

                {/* Paper Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paper Type
                  </label>
                  <select
                    value={paperData.paperType}
                    onChange={(e) => handleInputChange('paperType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Glossy">Glossy</option>
                    <option value="Matte">Matte</option>
                    <option value="Recycled">Recycled</option>
                    <option value="Cardstock">Cardstock</option>
                    <option value="Photo Paper">Photo Paper</option>
                  </select>
                </div>
                
                {/* Paper Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paper Weight
                  </label>
                  <select
                    value={paperData.paperWeight}
                    onChange={(e) => handleInputChange('paperWeight', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="70gsm">70gsm</option>
                    <option value="80gsm">80gsm</option>
                    <option value="90gsm">90gsm</option>
                    <option value="100gsm">100gsm</option>
                    <option value="120gsm">120gsm</option>
                  </select>
                </div>

                {/* Paper Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paper Color
                  </label>
                  <select
                    value={paperData.paperColor}
                    onChange={(e) => handleInputChange('paperColor', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="White">White</option>
                    <option value="Cream">Cream</option>
                    <option value="Ivory">Ivory</option>
                    <option value="Light Gray">Light Gray</option>
                    <option value="Blue">Blue</option>
                    <option value="Yellow">Yellow</option>
                  </select>
                </div>

                {/* Orientation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orientation
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="Portrait"
                        checked={paperData.orientation === 'Portrait'}
                        onChange={(e) => handleInputChange('orientation', e.target.value)}
                        className="mr-2"
                      />
                      Portrait
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="Landscape"
                        checked={paperData.orientation === 'Landscape'}
                        onChange={(e) => handleInputChange('orientation', e.target.value)}
                        className="mr-2"
                      />
                      Landscape
                    </label>
                  </div>
                </div>

                

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={paperData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2 text-lg font-bold text-blue-600  ">
                    <span>Total Price:</span>
                    <span>${calculatedPrice.totalPrice.toFixed(2)}</span>
                  </div>

                {/* Submit Button */}
                <div className="md:col-span-2">
                  <button
                    onClick={handleSubmit}
                    className="w-fit bg-yellow-400 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                  >
                    Add to cart 
                  </button>
                </div>
              </div>
            </div>
            
                  

            
          </div>
        </div>
      </div>
    </div>
  )
}

export default Customize




